const { Sequelize } = require('sequelize');

function toBool(value) {
  return String(value).toLowerCase() === 'true';
}

const dbPort = Number.parseInt(process.env.DB_PORT || '5432', 10);
const useSsl = toBool(process.env.DB_SSL);

const sequelize = new Sequelize(
  process.env.DB_NAME || 'codereview',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number.isNaN(dbPort) ? 5432 : dbPort,
    dialect: 'postgres',
    logging: toBool(process.env.DB_LOG_SQL) ? console.log : false,
    dialectOptions: useSsl
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : undefined,
  }
);

module.exports = sequelize;
