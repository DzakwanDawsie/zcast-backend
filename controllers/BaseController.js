'use strict';

const response = require('../utils/response');
const { uploadToCloud } = require('../utils/upload');

exports.index = async (req, res) => {
  // console.log(req);
  response.success(res);
};

exports.upload = async (req, res) => {
  const file = req.file;
  
  if (!file) {
    return response.failed(res, 'No file uploaded');
  }

  const uploadResult = await uploadToCloud(file, 'uploads');
  
  response.success(res, { 
    filename: uploadResult.public_id,
    url: uploadResult.secure_url 
  });
};

exports.notFound = async (req, res) => {
  response.failed(res);
};