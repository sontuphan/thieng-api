var configs = global.configs;

var db = require('../db');

module.exports = {

  /**
   * Get an order
   * @function getOrder
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  getOrder: function (req, res, next) {
    const auth = req.auth;
    const { _id } = req.query;
    if (!_id) return next('Invalid inputs');

    return db.Order.findOne(
      { _id, $or: [{ userId: auth._id }, { sellerId: auth._id }] },
      function (er, re) {
        if (er) return next('Database error');
        return res.send({ status: 'OK', data: re });
      });
  },

  /**
   * Get orders (for sellers)
   * @function getOrders
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  getOrders: function (req, res, next) {
    const auth = req.auth;
    const condition = req.query.condition || {}
    const limit = req.query.limit || configs.db.LIMIT_DEFAULT;
    const page = req.query.page || configs.db.PAGE_DEFAULT;

    return db.Order.aggregate([
      { $match: { ...condition, sellerId: auth._id } },
      { $sort: { createdAt: -1 } },
      { $skip: limit * page },
      { $limit: limit },
      { $project: { _id: 1 } }
    ]).exec(function (er, re) {
      console.log(er)
      if (er) return next('Database error');

      return res.send({ status: 'OK', data: re, pagination: { limit, page } });
    });
  },

  /**
   * Get my orders (for users)
   * @function getMyOrders
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  getMyOrders: function (req, res, next) {
    const auth = req.auth;
    const condition = req.query.condition || {}
    const limit = req.query.limit || configs.db.LIMIT_DEFAULT;
    const page = req.query.page || configs.db.PAGE_DEFAULT;

    return db.Order.aggregate([
      { $match: { ...condition, userId: auth._id } },
      { $sort: { createdAt: -1 } },
      { $skip: limit * page },
      { $limit: limit },
      { $project: { _id: 1 } }
    ]).exec(function (er, re) {
      console.log(er)
      if (er) return next('Database error');

      return res.send({ status: 'OK', data: re, pagination: { limit, page } });
    });
  },


  /**
   * Add order
   * @function addOrder
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  addOrder: function (req, res, next) {
    const auth = req.auth;
    const { order } = req.body;
    if (!order) return next('Invalid inputs');

    var newOrder = new db.Order({
      ...order,
      userId: auth._id,
    });
    return newOrder.save(function (er, re) {
      if (er) return next('Database error');
      return res.send({ status: 'OK', data: re });
    });
  },

  /**
   * Update order
   * @function updateOrder
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  updateOrder: function (req, res, next) {
    const auth = req.auth;
    const { order } = req.body;
    if (!order) return next('Invalid inputs');

    delete order.status; // Disallow users change order status
    delete order.paymentStatus; // Disallow users change order payment status
    return db.Order.findOneAndUpdate(
      { _id: order._id, userId: auth._id },
      { ...order, userId: auth._id },
      { new: true },
      function (er, re) {
        if (er) return next('Database error');
        return res.send({ status: 'OK', data: re });
      });
  },

  /**
   * Update order status (for seller only)
   * @function updateOrderStatus
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  updateOrderStatus: function (req, res, next) {
    const auth = req.auth;
    const { order } = req.body;
    if (!order || !order.status) return next('Invalid inputs');

    return db.Order.findOne(
      { _id: order._id, sellerId: auth._id },
      function (er, re) {
        if (er) return next('Database error');
        if (re.status == order.status) return next('Status is at this value already');

        let history = re.statusHistory;
        history.push({ status: order.status });
        return re.updateOne(
          { $set: { status: order.status, statusHistory: history } },
          function (er, re) {
            if (er) return next('Database error');
            return res.send({ status: 'OK', data: re });
          });
      });
  },

  /**
   * Update order payment status (for seller only)
   * @function updateOrderPaymentStatus
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  updateOrderPaymentStatus: function (req, res, next) {
    const auth = req.auth;
    const { order } = req.body;
    if (!order || typeof order.paymentStatus !== 'boolean') return next('Invalid inputs');

    return db.Order.findOneAndUpdate(
      { _id: order._id, sellerId: auth._id },
      { paymentStatus: order.paymentStatus },
      { new: true },
      function (er, re) {
        if (er) return next('Database error');
        return res.send({ status: 'OK', data: re });
      });
  },

  /**
   * Delete order
   * @function deleteOrder
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  deleteOrder: function (req, res, next) {
    const auth = req.auth;
    const { order } = req.body;
    if (!order) return next('Invalid inputs');

    return db.Order.findOneAndDelete(
      { _id: order._id, userId: auth._id },
      function (er, re) {
        if (er) return next('Database error');
        return res.send({ status: 'OK', data: re });
      });
  },
}