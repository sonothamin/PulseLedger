module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    isSupplementary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    parentProductId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    canSellStandalone: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });
  Product.associate = (models) => {
    Product.belongsTo(models.Product, { as: 'ParentProduct', foreignKey: 'parentProductId' });
  };
  return Product;
}; 