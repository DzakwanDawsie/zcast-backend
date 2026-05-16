'use strict';

const response = require('../utils/response');
const youtubeMusic = require('../utils/youtubeMusic');

exports.feeds = async (req, res) => {
  try {
    const items = await youtubeMusic.getHomeFeed();
    response.success(res, { items });
  } catch (error) {
    console.error('[MusicController] feeds error:', error);
    response.failed(res, error.message || 'Failed to fetch music feeds');
  }
};

exports.search = async (req, res) => {
  try {
    const { q, type = 'song' } = req.query;

    if (!q) {
      return response.failed(res, 'Query parameter "q" is required');
    }

    const validTypes = ['all', 'song', 'video', 'album', 'playlist', 'artist'];
    if (type && !validTypes.includes(type)) {
      return response.failed(res, `Invalid type. Must be one of: ${validTypes.join(', ')}`);
    }

    const result = await youtubeMusic.searchMusic(q, type);
    response.success(res, { items: result.items });
  } catch (error) {
    console.error('[MusicController] search error:', error);
    response.failed(res, error.message || 'Failed to search music');
  }
};

exports.relateds = async (req, res) => {
  try {
    const { videoId } = req.params;
    const result = await youtubeMusic.getRelatedMusic(videoId);
    response.success(res, result);
  } catch (error) {
    console.error('[MusicController] relateds error:', error);
    response.failed(res, error.message || 'Failed to fetch related music');
  }
};

exports.streamUrl = async (req, res) => {
  try {
    const { videoId } = req.params;
    const url = await youtubeMusic.getStreamUrl(videoId);
    const result = { url };
    response.success(res, result);
  } catch (error) {
    console.error('[MusicController] streamUrl error:', error);
    response.failed(res, error.message || 'Failed to get stream URL');
  }
};