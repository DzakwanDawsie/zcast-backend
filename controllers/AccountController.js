'use strict';

const response = require('../utils/response');
const youtubeMusic = require('../utils/youtubeMusic');

exports.profile = async (req, res) => {
  try {
    const profile = await youtubeMusic.getAccountProfile();
    response.success(res, profile);
  } catch (error) {
    console.error('[AccountController] profile error:', error);
    response.failed(res, error.message || 'Failed to fetch account profile');
  }
};

exports.status = async (req, res) => {
  try {
    const status = await youtubeMusic.getAccountStatus();
    response.success(res, status);
  } catch (error) {
    console.error('[AccountController] status error:', error);
    response.failed(res, error.message || 'Failed to check account status');
  }
};
