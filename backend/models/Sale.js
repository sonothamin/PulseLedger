module.exports = (sequelize, DataTypes) => {
  const Sale = sequelize.define('Sale', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    patientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    salesAgentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    cashierId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    total: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    discount: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    discountType: {
      type: DataTypes.STRING,
      defaultValue: 'fixed', // or 'percent'
    },
  });
  return Sale;
}; 