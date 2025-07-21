module.exports = (sequelize, DataTypes) => {
  const SupplementaryProduct = sequelize.define('SupplementaryProduct', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    parentProductId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    supplementaryProductId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });
  return SupplementaryProduct;
}; 