const { Product, SupplementaryProduct } = require('../models');
const { createAuditLog } = require('../utils/auditLogger');

const listProducts = async (req, res) => {
  const products = await Product.findAll();
  const allSupps = await SupplementaryProduct.findAll();
  const suppMap = {};
  allSupps.forEach(s => {
    if (!suppMap[s.parentProductId]) suppMap[s.parentProductId] = [];
    suppMap[s.parentProductId].push(s.supplementaryProductId);
  });
  const productsWithSupps = products.map(p => {
    const prod = p.toJSON();
    prod.supplementaryIds = suppMap[prod.id] || [];
    return prod;
  });
  res.json(productsWithSupps);
};

const getProduct = async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  const supps = await SupplementaryProduct.findAll({ where: { parentProductId: product.id } });
  const supplementaryIds = supps.map(s => s.supplementaryProductId);
  const prod = product.toJSON();
  prod.supplementaryIds = supplementaryIds;
  res.json(prod);
};

const createProduct = async (req, res) => {
  const { name, category, price, isSupplementary, parentProductId, description, isActive, supplementaryIds, canSellStandalone } = req.body;
  const product = await Product.create({ name, category, price, isSupplementary, parentProductId, description, isActive, canSellStandalone });
  if (supplementaryIds && supplementaryIds.length > 0) {
    for (const sid of supplementaryIds) {
      await SupplementaryProduct.create({ parentProductId: product.id, supplementaryProductId: sid });
    }
  }
  await createAuditLog(
    req.user.id,
    'product:create',
    {
      name,
      category,
      price,
      isSupplementary,
      parentProductId,
      description,
      isActive,
      supplementaryIds,
      canSellStandalone,
      description: `'${name}' as ${category}'`
    },
    'products',
    'Product',
    product.id
  );
  res.status(201).json(product);
};

const updateProduct = async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  const { name, category, price, isSupplementary, parentProductId, description, isActive, supplementaryIds, canSellStandalone } = req.body;
  const oldValues = product.toJSON();
  const newValues = { name, category, price, isSupplementary, parentProductId, description, isActive, supplementaryIds, canSellStandalone };
  const changed = {};
  for (const key of Object.keys(newValues)) {
    if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
      changed[key] = { from: oldValues[key], to: newValues[key] };
    }
  }
  await product.update({ name, category, price, isSupplementary, parentProductId, description, isActive, canSellStandalone });
  if (supplementaryIds) {
    await SupplementaryProduct.destroy({ where: { parentProductId: product.id } });
    for (const sid of supplementaryIds) {
      await SupplementaryProduct.create({ parentProductId: product.id, supplementaryProductId: sid });
    }
  }
  await createAuditLog(
    req.user.id,
    'product:update',
    {
      name,
      category,
      price,
      isSupplementary,
      parentProductId,
      description,
      isActive,
      supplementaryIds,
      canSellStandalone,
      changed,
      description: `'${name}' in '${category}'` + (Object.keys(changed).length ? `; Changed: ${Object.keys(changed).join(', ')}` : '')
    },
    'products',
    'Product',
    product.id
  );
  res.json(product);
};

const deleteProduct = async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  await SupplementaryProduct.destroy({ where: { parentProductId: product.id } });
  await product.destroy();
  await createAuditLog(
    req.user.id,
    'product:delete',
    { id: req.params.id, name: product.name, category: product.category },
    'products',
    'Product',
    req.params.id
  );
  res.json({ message: 'Product deleted' });
};

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct }; 