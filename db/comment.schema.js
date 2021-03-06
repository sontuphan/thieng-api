var mongoose = require('mongoose');

/**
 * Schema
 */
var Comment = new mongoose.Schema({
  // Target can be items, blueprints, or other comments
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  contents: { type: String, required: true },
}, { timestamps: true });

/**
 * Module exports
 */
module.exports = mongoose.model('Comment', Comment);