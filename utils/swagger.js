'use strict';

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ZCast API',
      version: '1.0.0',
      description: 'ZCast backend API documentation'
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3001}`,
        description: 'Local server'
      }
    ],
    components: {
      schemas: {
        SearchItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string' },
            thumbnail: { type: 'string' },
            title: { type: 'string' },
            name: { type: 'string' },
            artists: { type: 'array', items: { type: 'string' } },
            album: { type: 'string' },
            duration: { type: 'string' },
            views: { type: 'string' },
            year: { type: 'string' },
            songCount: { type: 'string' },
            subscribers: { type: 'string' },
            author: { type: 'string' },
            itemCount: { type: 'string' },
            subtitle: { type: 'string' }
          }
        }
      }
    },
    paths: {
      '/': {
        get: {
          tags: ['Base'],
          summary: 'Health check',
          responses: {
            '200': {
              description: 'OK',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/upload': {
        post: {
          tags: ['Base'],
          summary: 'Upload a file to Cloudinary',
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    file: {
                      type: 'string',
                      format: 'binary'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'File uploaded successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                      data: {
                        type: 'object',
                        properties: {
                          filename: { type: 'string' },
                          url: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/music/feeds': {
        get: {
          tags: ['Music'],
          summary: 'Get YouTube Music home feed',
          description: 'Returns a list of songs/videos from the YouTube Music homepage. Requires YouTube cookie authentication.',
          responses: {
            '200': {
              description: 'Feed items',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                      data: {
                        type: 'object',
                        properties: {
                          items: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                videoId: { type: 'string' },
                                title: { type: 'string' },
                                artist: { type: 'string' },
                                thumbnail: { type: 'string' }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/music/search': {
        get: {
          tags: ['Music'],
          summary: 'Search YouTube Music',
          description: 'Search YouTube Music. Default search type is songs. Requires YouTube cookie authentication.',
          parameters: [
            {
              name: 'q',
              in: 'query',
              required: true,
              description: 'Search query (title, artist, etc.)',
              schema: { type: 'string' }
            },
            {
              name: 'type',
              in: 'query',
              required: false,
              description: 'Filter by type (default: song)',
              schema: {
                type: 'string',
                enum: ['all', 'song', 'video', 'album', 'playlist', 'artist'],
                default: 'song'
              }
            }
          ],
          responses: {
            '200': {
              description: 'Search results',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                      data: {
                        type: 'object',
                        properties: {
                          items: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/SearchItem' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/music/{videoId}/relateds': {
        get: {
          tags: ['Music'],
          summary: 'Get related music',
          description: 'Returns related songs, albums, artists, etc. for a given track. Requires YouTube cookie authentication.',
          parameters: [
            {
              name: 'videoId',
              in: 'path',
              required: true,
              description: 'YouTube video ID of the track',
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': {
              description: 'Related music sections',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                      data: {
                        type: 'object',
                        properties: {
                          items: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/SearchItem' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/music/{videoId}/stream-url': {
        get: {
          tags: ['Music'],
          summary: 'Get audio stream URL',
          description: 'Returns a direct audio streaming URL for a given YouTube video. Requires YouTube cookie authentication.',
          parameters: [
            {
              name: 'videoId',
              in: 'path',
              required: true,
              description: 'YouTube video ID',
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': {
              description: 'Audio stream URL',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                      data: {
                        type: 'object',
                        properties: {
                          url: { type: 'string', description: 'Direct audio stream URL' }
                        }
                      }
                    }
                  }
                }
              }
            },
            '500': {
              description: 'Failed to get stream URL'
            }
          }
        }
      },
      '/account/profile': {
        get: {
          tags: ['Account'],
          summary: 'Get logged-in user profile',
          description: 'Returns the profile information of the currently authenticated YouTube user via cookies.',
          responses: {
            '200': {
              description: 'User profile data',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                      data: {
                        type: 'object',
                        properties: {
                          header: {
                            type: 'object',
                            properties: {
                              title: { type: 'string' }
                            }
                          },
                          channels: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                name: { type: 'string' },
                                handle: { type: 'string' },
                                byline: { type: 'string' },
                                photo: {
                                  type: 'array',
                                  items: { type: 'string' }
                                },
                                isSelected: { type: 'boolean' },
                                hasChannel: { type: 'boolean' }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized - cookie invalid or expired'
            }
          }
        }
      },
      '/account/status': {
        get: {
          tags: ['Account'],
          summary: 'Check cookie/authentication status',
          description: 'Checks whether the YouTube cookie is valid and the session is authenticated.',
          responses: {
            '200': {
              description: 'Authentication status',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                      data: {
                        type: 'object',
                        properties: {
                          loggedIn: { type: 'boolean' },
                          valid: { type: 'boolean' },
                          reason: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  apis: []
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
