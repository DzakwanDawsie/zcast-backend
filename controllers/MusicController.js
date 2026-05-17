'use strict';

const https = require('node:https');
const http = require('node:http');
const { URL } = require('node:url');
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

function proxyAudio(cdnUrl, clientReq, clientRes) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (compatible)',
    'Accept': '*/*'
  };

  if (clientReq.headers.range) {
    headers['Range'] = clientReq.headers.range;
  }

  const parsed = new URL(cdnUrl);
  const fetcher = parsed.protocol === 'https:' ? https : http;

  const proxyReq = fetcher.get(cdnUrl, { headers }, (proxyRes) => {
    if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
      const redirectUrl = new URL(proxyRes.headers.location, cdnUrl).href;
      proxyAudio(redirectUrl, clientReq, clientRes);
      return;
    }

    clientRes.status(proxyRes.statusCode);
    const forwardHeaders = [
      'content-type', 'content-length', 'content-range',
      'accept-ranges', 'cache-control', 'etag', 'last-modified'
    ];
    forwardHeaders.forEach((h) => {
      const val = proxyRes.headers[h];
      if (val) clientRes.setHeader(h, val);
    });
    proxyRes.pipe(clientRes);
  });

  proxyReq.on('error', (err) => {
    console.error('[MusicController] streamAudio proxy error:', err.message);
    if (!clientRes.headersSent) {
      clientRes.status(502).json({ success: false, message: 'Failed to fetch audio stream' });
    }
  });

  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    if (!clientRes.headersSent) {
      clientRes.status(504).json({ success: false, message: 'Audio stream timeout' });
    }
  });

  proxyReq.end();
}

exports.streamAudio = async (req, res) => {
  try {
    const { videoId } = req.params;
    const cdnUrl = await youtubeMusic.getStreamUrl(videoId);
    proxyAudio(cdnUrl, req, res);
  } catch (error) {
    console.error('[MusicController] streamAudio error:', error);
    response.failed(res, error.message || 'Failed to stream audio');
  }
};