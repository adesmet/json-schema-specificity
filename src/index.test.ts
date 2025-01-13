import { extendSchema } from './index';

describe('extendSchema', () => {
  describe('basic functionality', () => {
    it('should handle null/undefined values', () => {
      expect(extendSchema(null as any, { type: 'string' })).toEqual({ type: 'string' });
      expect(extendSchema({ type: 'string' }, null as any)).toEqual(null);
      expect(extendSchema(undefined as any, { type: 'string' })).toEqual({ type: 'string' });
      expect(extendSchema({ type: 'string' }, undefined as any)).toEqual({ type: 'string' });
    });

    it('should merge simple objects', () => {
      const base = { type: 'object', required: ['name'] };
      const extension = { additionalProperties: false };
      expect(extendSchema(base, extension)).toEqual({
        type: 'object',
        required: ['name'],
        additionalProperties: false,
      });
    });

    it('should override primitive values', () => {
      const base = { type: 'string', minLength: 1 };
      const extension = { minLength: 5 };
      expect(extendSchema(base, extension)).toEqual({
        type: 'string',
        minLength: 5,
      });
    });
  });

  describe('nested objects', () => {
    it('should merge nested object properties', () => {
      const base = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
      };
      const extension = {
        properties: {
          user: {
            properties: {
              age: { type: 'number' },
            },
          },
        },
      };
      expect(extendSchema(base, extension)).toEqual({
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              age: { type: 'number' },
            },
          },
        },
      });
    });

    it('should handle deep property overrides', () => {
      const base = {
        properties: {
          user: {
            properties: {
              settings: {
                type: 'object',
                properties: {
                  theme: { type: 'string' },
                },
              },
            },
          },
        },
      };
      const extension = {
        properties: {
          user: {
            properties: {
              settings: {
                properties: {
                  theme: { type: 'string', enum: ['light', 'dark'] },
                },
              },
            },
          },
        },
      };
      expect(extendSchema(base, extension)).toEqual({
        properties: {
          user: {
            properties: {
              settings: {
                type: 'object',
                properties: {
                  theme: { type: 'string', enum: ['light', 'dark'] },
                },
              },
            },
          },
        },
      });
    });
  });

  describe('array handling', () => {
    it('should override array values entirely', () => {
      const base = { type: 'array', items: { type: 'string' } };
      const extension = { items: { type: 'number' } };
      expect(extendSchema(base, extension)).toEqual({
        type: 'array',
        items: { type: 'number' },
      });
    });
  });

  describe('real world example', () => {
    it('should handle the resolution schema example', () => {
      const original = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          type: { type: 'string' },
          title: { type: 'string' },
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                votes: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      personId: { type: 'string' },
                      createdAt: { type: 'string' },
                      vote: { type: 'string' },
                    },
                    required: ['personId', 'createdAt', 'vote'],
                    additionalProperties: false,
                  },
                },
              },
              required: ['description', 'votes'],
              additionalProperties: false,
            },
            minItems: 1,
          },
        },
        required: ['type', 'title', 'questions'],
        additionalProperties: true,
      };

      const delta = {
        properties: {
          questions: {
            maxItems: 1,
            items: {
              properties: {
                votes: {
                  items: {
                    properties: {
                      vote: {
                        enum: ['for', 'against', 'abstain'],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };

      const result = extendSchema(original, delta) as {
        properties: {
          questions: {
            maxItems: number;
            items: {
              properties: {
                votes: {
                  items: {
                    properties: {
                      vote: {
                        enum: string[];
                      };
                    };
                  };
                };
              };
            };
          };
        };
      };
      expect(result.properties.questions.maxItems).toBe(1);
      expect(result.properties.questions.items.properties.votes.items.properties.vote.enum).toEqual(
        ['for', 'against', 'abstain']
      );
    });
  });
});
