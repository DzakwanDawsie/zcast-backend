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

exports.streamAudio = async (req, res) => {
  try {
    const { videoId } = req.params;
    const cdnUrl = await youtubeMusic.getStreamUrl(videoId);
    const parsed = new URL(cdnUrl);
    const fetcher = parsed.protocol === 'https:' ? https : http;

    const proxyReq = fetcher.get(cdnUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible)',
        'Accept': '*/*'
      }
    }, (proxyRes) => {
      if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
        const redirectUrl = new URL(proxyRes.headers.location, cdnUrl).href;
        const redirectFetcher = redirectUrl.startsWith('https') ? https : http;

        redirectFetcher.get(redirectUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible)',
            'Accept': '*/*'
          }
        }, (redirectRes) => {
          res.status(redirectRes.statusCode);
          Object.keys(redirectRes.headers).forEach((key) => {
            res.setHeader(key, redirectRes.headers[key]);
          });
          redirectRes.pipe(res);
        }).on('error', (err) => {
          console.error('[MusicController] streamAudio redirect error:', err.message);
          if (!res.headersSent) {
            res.status(502).json({ success: false, message: 'Failed to fetch audio stream' });
          }
        });
        return;
      }

      res.status(proxyRes.statusCode);
      Object.keys(proxyRes.headers).forEach((key) => {
        res.setHeader(key, proxyRes.headers[key]);
      });
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('[MusicController] streamAudio proxy error:', err.message);
      if (!res.headersSent) {
        res.status(502).json({ success: false, message: 'Failed to fetch audio stream' });
      }
    });

    proxyReq.on('timeout', () => {
      proxyReq.destroy();
      if (!res.headersSent) {
        res.status(504).json({ success: false, message: 'Audio stream timeout' });
      }
    });

    proxyReq.end();
  } catch (error) {
    console.error('[MusicController] streamAudio error:', error);
    response.failed(res, error.message || 'Failed to stream audio');
  }
};