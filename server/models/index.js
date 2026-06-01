const sequelize = require('../db/sequelize');
const createUserModel = require('./user');

const User = createUserModel(sequelize);

async function initializeDatabase() {
  await sequelize.authenticate();
  await sequelize.sync();
}

module.exports = {
  sequelize,
  User,
  initializeDatabase,
};
