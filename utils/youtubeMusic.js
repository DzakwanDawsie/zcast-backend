'use strict';

let innertube = null;
let initializing = false;

async function getInstance() {
  if (innertube) return innertube;

  if (initializing) {
    while (!innertube) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return innertube;
  }

  initializing = true;

  try {
    const { Innertube, Platform } = await import('youtubei.js');

    Platform.shim.eval = async (data, env) => {
      const keys = Object.keys(env);
      const values = Object.values(env);
      const fn = new Function(...keys, data.output);
      return fn(...values);
    };

    innertube = await Innertube.create({
      cookie: process.env.YT_COOKIE
    });

    console.log('[YTMusic] Innertube initialized');

    return innertube;
  } catch (e) {
    initializing = false;
    innertube = null;
    console.error('[YTMusic] Init failed:', e.message);
    throw e;
  } finally {
    if (innertube) initializing = false;
  }
}

exports.getHomeFeed = async function () {
  const yt = await getInstance();
  const feed = await yt.music.getHomeFeed();

  const items = [];

  if (feed.sections) {
    for (const section of feed.sections) {
      if (!section.contents) continue;

      for (const item of section.contents) {
        if (item.item_type !== 'song' && item.item_type !== 'video') continue;

        const thumbnail = item.thumbnail?.[0]?.url || item.thumbnails?.[0]?.url || null;

        items.push({
          videoId: item.id || null,
          title: typeof item.title === 'string' ? item.title : item.title?.toString() || null,
          artist: item.artists?.map(a => a.name).join(', ') || item.author?.name || null,
          thumbnail
        });
      }
    }
  }

  return items;
};

exports.getAccountProfile = async function () {
  const yt = await getInstance();
  const accountInfo = await yt.account.getInfo();

  const section = accountInfo.contents;

  const result = {
    channels: []
  };

  if (section) {
    if (section.header) {
      result.header = {
        title: section.header.title?.toString() || null
      };
    }

    for (const item of section.contents) {
      result.channels.push({
        name: item.account_name?.toString() || null,
        handle: item.channel_handle?.toString() || null,
        byline: item.account_byline?.toString() || null,
        photo: item.account_photo?.map(t => t.url) || [],
        isSelected: item.is_selected || false,
        hasChannel: item.has_channel || false
      });
    }
  }

  return result;
};

exports.getAccountStatus = async function () {
  const yt = await getInstance();

  const status = {
    loggedIn: yt.session.logged_in
  };

  if (!status.loggedIn) {
    status.valid = false;
    status.reason = 'Not logged in';
    return status;
  }

  try {
    await yt.account.getInfo();
    status.valid = true;
  } catch (e) {
    status.valid = false;
    status.reason = e.message || 'Cookie expired or invalid';
  }

  return status;
};

exports.searchMusic = async function (query, type) {
  const yt = await getInstance();
  const filters = type ? { type } : undefined;
  const search = await yt.music.search(query, filters);

  const normalizeItems = (shelf) => {
    if (!shelf || !shelf.contents) return [];
    return shelf.contents.map(item => {
      const thumbnail = item.thumbnails?.[0]?.url || null;

      const base = {
        id: item.id || null,
        type: item.item_type || null,
        thumbnail
      };

      switch (item.item_type) {
        case 'song':
          return {
            ...base,
            title: item.title || null,
            artists: item.artists?.map(a => a.name) || [],
            album: item.album?.name || null,
            duration: item.duration?.text || null
          };
        case 'video':
          return {
            ...base,
            title: item.title || null,
            artists: item.artists?.map(a => a.name) || [],
            views: item.views || null,
            duration: item.duration?.text || null
          };
        case 'album':
          return {
            ...base,
            title: item.title || null,
            artists: item.artists?.map(a => a.name) || [],
            year: item.year || null,
            songCount: item.song_count || null
          };
        case 'artist':
        case 'library_artist':
          return {
            ...base,
            name: item.name || item.title || null,
            subscribers: item.subscribers || null
          };
        case 'playlist':
          return {
            ...base,
            title: item.title || null,
            author: item.author?.name || null,
            itemCount: item.item_count || null
          };
        case 'podcast_show':
          return {
            ...base,
            title: item.title || null,
            author: item.author?.name || null
          };
        default:
          return {
            ...base,
            title: item.title || item.name || null,
            subtitle: item.subtitle?.toString() || null,
            artists: item.artists?.map(a => a.name) || []
          };
      }
    });
  };

  const items = [];
  for (const arr of [search.songs, search.videos, search.albums, search.artists, search.playlists]) {
    if (arr) items.push(...normalizeItems(arr));
  }

  return { items };
};

function normalizeMusicItem(item) {
  const thumbnail = item.thumbnails?.[0]?.url || item.thumbnail?.[0]?.url || null;
  const itemType = item.item_type || null;
  const id = item.id || item.video_id || null;

  const base = { id, type: itemType, thumbnail };

  switch (itemType) {
    case 'song':
      return {
        ...base,
        title: item.title?.toString() || null,
        artists: item.artists?.map(a => typeof a === 'string' ? a : a.name) || [],
        album: item.album?.name || null,
        duration: item.duration?.text || null
      };
    case 'video':
      return {
        ...base,
        title: item.title?.toString() || null,
        artists: item.artists?.map(a => typeof a === 'string' ? a : a.name) || [],
        views: item.views || null,
        duration: item.duration?.text || null
      };
    case 'album':
      return {
        ...base,
        title: item.title?.toString() || null,
        artists: item.artists?.map(a => typeof a === 'string' ? a : a.name) || [],
        year: item.year || null,
        songCount: item.song_count || item.item_count || null,
        subtitle: item.subtitle?.toString() || null
      };
    case 'artist':
    case 'library_artist':
      return {
        ...base,
        name: item.name || item.title?.toString() || null,
        subscribers: item.subscribers || null,
        subtitle: item.subtitle?.toString() || null
      };
    case 'playlist':
      return {
        ...base,
        title: item.title?.toString() || null,
        author: item.author?.name || null,
        itemCount: item.item_count || null,
        subtitle: item.subtitle?.toString() || null
      };
    case 'podcast_show':
      return {
        ...base,
        title: item.title?.toString() || null,
        author: item.author?.name || null,
        subtitle: item.subtitle?.toString() || null
      };
    default:
      return {
        ...base,
        title: item.title?.toString() || item.name || null,
        subtitle: item.subtitle?.toString() || null,
        artists: item.artists?.map(a => typeof a === 'string' ? a : a.name) || [],
        views: item.views || null,
        author: item.author?.name || null
      };
  }
}

exports.getStreamUrl = async function (videoId) {
  const yt = await getInstance();
  // Use YTMUSIC client which is a web-based music client (compatible with WEB session)
  const info = await yt.getBasicInfo(videoId, { client: 'YTMUSIC' });

  if (!info.streaming_data) {
    throw new Error('No streaming data available');
  }

  const adaptiveFormats = info.streaming_data.adaptive_formats || [];
  const progressiveFormats = info.streaming_data.formats || [];

  const player = yt.session.player;

  // Try audio-only adaptive formats first
  const audioFormats = adaptiveFormats
    .filter((f) => f.has_audio && !f.has_video && !f.has_text)
    .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

  for (const format of audioFormats) {
    try {
      const url = await format.decipher(player);
      if (url) return url;
    } catch { /* skip */ }
  }

  // Fallback to progressive formats (combined audio+video)
  const combinedFormats = [...progressiveFormats]
    .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

  for (const format of combinedFormats) {
    try {
      const url = await format.decipher(player);
      if (url) return url;
    } catch { /* skip */ }
  }

  throw new Error('Could not get audio stream URL from any format');
};

exports.getRelatedMusic = async function (videoId) {
  const yt = await getInstance();
  const result = await yt.music.getRelated(videoId);

  if (!result || result.type === 'Message') {
    return { items: [] };
  }

  const items = [];

  for (const node of result.contents) {
    if (node.type === 'MusicCarouselShelf') {
      for (const item of node.contents) {
        if (item.type === 'MusicNavigationButton') continue;
        items.push(normalizeMusicItem(item));
      }
    }
  }

  return { items };
};
