const sequelize = require('../db/sequelize');
const createUserModel = require('./user');
const createReviewModel = require('./review');
const createReviewCommentModel = require('./reviewComment');

const User = createUserModel(sequelize);
const Review = createReviewModel(sequelize);
const ReviewComment = createReviewCommentModel(sequelize);

User.hasMany(Review, { foreignKey: 'user_id', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Review.hasMany(ReviewComment, { foreignKey: 'review_id', as: 'comments' });
ReviewComment.belongsTo(Review, { foreignKey: 'review_id', as: 'review' });

async function initializeDatabase() {
  await sequelize.authenticate();
  await sequelize.sync();
}

module.exports = {
  sequelize,
  User,
  Review,
  ReviewComment,
  initializeDatabase,
};
