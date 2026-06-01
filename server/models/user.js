const { DataTypes } = require('sequelize');

function createUserModel(sequelize) {
  return sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      githubId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'github_id',
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      avatarUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'avatar_url',
      },
      profileUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'profile_url',
      },
    },
    {
      tableName: 'users',
      underscored: true,
    }
  );
}

module.exports = createUserModel;
