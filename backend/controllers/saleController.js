const { Sale, SaleItem, Product, Patient, SalesAgent, User, SupplementaryProduct } = require('../models');
const { Op } = require('sequelize');
const { broadcast } = require('../realtime');
const { createAuditLog } = require('../utils/auditLogger');

const listSales = async (req, res) => {
  const { start, end } = req.query;
  const where = {};
  
  if (start && end) {
    where.createdAt = {
      [Op.gte]: new Date(start),
      [Op.lte]: new Date(end + 'T23:59:59.999Z')
    };
  }
  
  const sales = await Sale.findAll({
    where,
    include: [
      Patient,
      SalesAgent,
      { model: User, as: 'Cashier' },
      { model: SaleItem, include: [Product] }
    ],
    order: [['createdAt', 'DESC']]
  });
  res.json(sales);
};

const getSalesStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get total sales
    const totalSalesResult = await Sale.findOne({
      attributes: [
        [Sale.sequelize.fn('SUM', Sale.sequelize.col('total')), 'totalSales']
      ]
    });

    // Get today's sales
    const todaySalesResult = await Sale.findOne({
      attributes: [
        [Sale.sequelize.fn('SUM', Sale.sequelize.col('total')), 'todaySales']
      ],
      where: {
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });

    const totalSales = parseFloat(totalSalesResult?.dataValues?.totalSales || 0);
    const todaySales = parseFloat(todaySalesResult?.dataValues?.todaySales || 0);

    res.json({
      totalSales,
      todaySales
    });
  } catch (error) {
    console.error('Error getting sales stats:', error);
    res.status(500).json({ message: 'Failed to get sales statistics' });
  }
};

const getSale = async (req, res) => {
  const sale = await Sale.findByPk(req.params.id, {
    include: [
      Patient,
      SalesAgent,
      { model: User, as: 'Cashier' },
      { model: SaleItem, include: [Product] }
    ]
  });
  if (!sale) return res.status(404).json({ message: 'Sale not found' });
  res.json(sale);
};

const createSale = async (req, res) => {
  const { patientId, salesAgentId, cashierId, items, discount, discountType } = req.body;
  let total = 0;
  const saleItems = [];
  for (const item of items) {
    const product = await Product.findByPk(item.productId);
    if (!product) return res.status(400).json({ message: `Product ${item.productId} not found` });
    let price = product.price * (item.quantity || 1);
    saleItems.push({ productId: product.id, quantity: item.quantity || 1, price, isSupplementary: false });
    total += price;
    // Add supplementary products
    const supplementaries = await SupplementaryProduct.findAll({ where: { parentProductId: product.id } });
    for (const sup of supplementaries) {
      const supProduct = await Product.findByPk(sup.supplementaryProductId);
      if (supProduct) {
        saleItems.push({ productId: supProduct.id, quantity: 1, price: supProduct.price, isSupplementary: true, supplementaryParentId: product.id });
        total += supProduct.price;
      }
    }
  }
  let discountAmount = 0;
  if (discountType === 'percent') {
    discountAmount = total * (discount / 100);
  } else {
    discountAmount = discount;
  }
  total -= discountAmount;
  const sale = await Sale.create({ patientId, salesAgentId, cashierId, total, discount, discountType });
  for (const si of saleItems) {
    await SaleItem.create({ ...si, saleId: sale.id });
  }
  
  // Create audit log for sale creation
  await createAuditLog(
    cashierId,
    'sale:create',
    {
      description: `Created sale #${sale.id} with ${items.length} items for total $${total.toFixed(2)}`,
      saleId: sale.id,
      patientId,
      salesAgentId,
      total,
      discount,
      discountType,
      itemCount: items.length,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    },
    'sales',
    'Sale',
    sale.id
  );
  
  broadcast('sale:new', { saleId: sale.id });
  res.status(201).json(sale);
};

const updateSale = async (req, res) => {
  const sale = await Sale.findByPk(req.params.id, { include: [SaleItem] });
  if (!sale) return res.status(404).json({ message: 'Sale not found' });
  const { patientId, salesAgentId, discount, discountType, items } = req.body;
  // Update sale fields
  await sale.update({ patientId, salesAgentId, discount, discountType });
  // Remove old items
  await SaleItem.destroy({ where: { saleId: sale.id } });
  // Add new items
  if (Array.isArray(items)) {
    for (const item of items) {
      await SaleItem.create({
        saleId: sale.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        isSupplementary: item.isSupplementary || false,
        supplementaryParentId: item.supplementaryParentId || null
      });
    }
  }
  // Create audit log for sale update
  await createAuditLog(
    req.user.id,
    'sale:update',
    {
      description: `Updated sale #${sale.id}`,
      saleId: sale.id,
      patientId,
      salesAgentId,
      discount,
      discountType,
      itemCount: items?.length || 0,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    },
    'sales',
    'Sale',
    sale.id
  );
  
  // Return the full updated sale with all relations
  const updatedSale = await Sale.findByPk(sale.id, {
    include: [
      Patient,
      SalesAgent,
      { model: User, as: 'Cashier' },
      { model: SaleItem, include: [Product] }
    ]
  });
  res.json(updatedSale);
};

const deleteSale = async (req, res) => {
  const sale = await Sale.findByPk(req.params.id);
  if (!sale) return res.status(404).json({ message: 'Sale not found' });
  
  const saleId = sale.id;
  const saleTotal = sale.total;
  
  await SaleItem.destroy({ where: { saleId: sale.id } });
  await sale.destroy();
  
  // Create audit log for sale deletion
  await createAuditLog(
    req.user.id,
    'sale:delete',
    {
      description: `Deleted sale #${saleId} with total $${saleTotal.toFixed(2)}`,
      saleId,
      total: saleTotal,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    },
    'sales',
    'Sale',
    saleId
  );
  
  res.json({ message: 'Sale deleted' });
};

// Utility to recalculate and fix the total for a sale
const recalculateSaleTotal = async (saleId) => {
  const sale = await Sale.findByPk(saleId, { include: [SaleItem] });
  if (!sale) throw new Error('Sale not found');
  let total = 0;
  for (const item of sale.SaleItems) {
    total += (item.price * (item.quantity || 1));
  }
  let discountAmount = 0;
  if (sale.discountType === 'percent') {
    discountAmount = total * (sale.discount / 100);
  } else {
    discountAmount = sale.discount;
  }
  total -= discountAmount;
  await sale.update({ total });
  return total;
};

// Endpoint to recalculate and fix a sale's total
const recalculateSale = async (req, res) => {
  try {
    const total = await recalculateSaleTotal(req.params.id);
    res.json({ message: 'Sale total recalculated', total });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = { listSales, getSale, createSale, updateSale, deleteSale, getSalesStats, recalculateSale }; 