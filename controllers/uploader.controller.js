var configs = global.configs;
var multer = require('multer');

var db = require('../db');

module.exports = {

  /**
   * Middelware uploader
   * @param {*} req 
   * @param {*} res 
   * @param {*} next 
   */
  middelware: function (type) {
    return multer({
      limits: {
        fieldNameSize: 1024,
        fileSize: configs.db.LIMIT_FILE_SIZE[type],
      },
      fileFilter: function (req, file, callback) {
        if (!Object.keys(configs.db.FILE_TYPES).includes(type))
          return callback('Unsupported file type', false);
        if (!configs.db.FILE_TYPES[type].includes(file.mimetype))
          return callback('Unsupported file type', false);
        return callback(null, true);
      },
      storage: multer.diskStorage({
        destination: function (req, file, callback) {
          return callback(null, configs.db.UPLOADER_PATH[type]);
        },
        filename: function (req, file, callback) {
          return callback(null, Date.now() + '-' + file.originalname);
        }
      })
    }).single(type);
  },

  /**
   * Save info
   * @function saveInfo
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  saveInfo: function (req, res, next) {
    const auth = req.auth;
    const file = req.file;
    if (!file) return next('Invalid inputs');

    let newFile = new db.File({
      name: file.filename,
      type: file.mimetype,
      source: 'http://localhost:3001/' + file.destination + '/' + file.filename,
      userId: auth._id,
    });

    newFile.save(function (er, re) {
      if (er) return next('Database error');

      return res.send({ status: 'OK', data: re });
    });
  }
}