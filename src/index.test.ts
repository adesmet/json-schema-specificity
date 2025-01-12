import jsonSchemaSpecificity from './index';
const { isMoreSpecific, createExtension } = jsonSchemaSpecificity;

describe('isMoreSpecific', () => {
  describe('type compatibility', () => {
    it('should allow integer to be more specific than number', () => {
      expect(isMoreSpecific({ type: 'number' }, { type: 'integer' })).toBe(true);
    });

    it('should not allow number to be more specific than integer', () => {
      expect(isMoreSpecific({ type: 'integer' }, { type: 'number' })).toBe(false);
    });

    it('should handle array of types', () => {
      expect(isMoreSpecific({ type: ['string', 'number'] }, { type: ['string', 'integer'] })).toBe(
        true
      );
    });
  });

  describe('required properties', () => {
    it('should allow adding required properties', () => {
      expect(
        isMoreSpecific(
          {
            type: 'object',
            required: ['name'],
            properties: { name: { type: 'string' } },
          },
          {
            type: 'object',
            required: ['name', 'age'],
            properties: {
              name: { type: 'string' },
              age: { type: 'number' },
            },
          }
        )
      ).toBe(true);
    });

    it('should not allow removing required properties', () => {
      expect(
        isMoreSpecific(
          {
            type: 'object',
            required: ['name', 'age'],
            properties: {
              name: { type: 'string' },
              age: { type: 'number' },
            },
          },
          {
            type: 'object',
            required: ['name'],
            properties: { name: { type: 'string' } },
          }
        )
      ).toBe(false);
    });
  });

  describe('enum values', () => {
    it('should allow enum subset', () => {
      expect(
        isMoreSpecific(
          { type: 'string', enum: ['a', 'b', 'c'] },
          { type: 'string', enum: ['a', 'b'] }
        )
      ).toBe(true);
    });

    it('should not allow enum superset', () => {
      expect(
        isMoreSpecific(
          { type: 'string', enum: ['a', 'b'] },
          { type: 'string', enum: ['a', 'b', 'c'] }
        )
      ).toBe(false);
    });

    it('should not allow different enum values', () => {
      expect(
        isMoreSpecific(
          { type: 'string', enum: ['a', 'b', 'c'] },
          { type: 'string', enum: ['x', 'y'] }
        )
      ).toBe(false);
    });
  });

  describe('numeric constraints', () => {
    it('should allow narrowing numeric range', () => {
      expect(
        isMoreSpecific(
          { type: 'number', minimum: 0, maximum: 100 },
          { type: 'number', minimum: 10, maximum: 50 }
        )
      ).toBe(true);
    });

    it('should not allow expanding numeric range', () => {
      expect(
        isMoreSpecific(
          { type: 'number', minimum: 10, maximum: 50 },
          { type: 'number', minimum: 0, maximum: 100 }
        )
      ).toBe(false);
    });

    it('should handle multipleOf constraints', () => {
      expect(
        isMoreSpecific({ type: 'number', multipleOf: 2 }, { type: 'number', multipleOf: 4 })
      ).toBe(true);

      expect(
        isMoreSpecific({ type: 'number', multipleOf: 4 }, { type: 'number', multipleOf: 2 })
      ).toBe(false);
    });
  });

  describe('array constraints', () => {
    it('should allow narrowing array length range', () => {
      expect(
        isMoreSpecific(
          {
            type: 'array',
            items: { type: 'number' },
            minItems: 1,
            maxItems: 10,
          },
          {
            type: 'array',
            items: { type: 'integer' },
            minItems: 2,
            maxItems: 5,
          }
        )
      ).toBe(true);
    });

    it('should not allow expanding array length range', () => {
      expect(
        isMoreSpecific(
          {
            type: 'array',
            items: { type: 'number' },
            minItems: 2,
            maxItems: 5,
          },
          {
            type: 'array',
            items: { type: 'number' },
            minItems: 1,
            maxItems: 10,
          }
        )
      ).toBe(false);
    });

    it('should enforce uniqueItems constraint', () => {
      expect(
        isMoreSpecific({ type: 'array', uniqueItems: true }, { type: 'array', uniqueItems: false })
      ).toBe(false);

      expect(
        isMoreSpecific({ type: 'array', uniqueItems: false }, { type: 'array', uniqueItems: true })
      ).toBe(true);
    });
  });

  describe('string constraints', () => {
    it('should allow narrowing string length range', () => {
      expect(
        isMoreSpecific(
          { type: 'string', minLength: 1, maxLength: 100 },
          { type: 'string', minLength: 5, maxLength: 50 }
        )
      ).toBe(true);
    });

    it('should not allow expanding string length range', () => {
      expect(
        isMoreSpecific(
          { type: 'string', minLength: 5, maxLength: 50 },
          { type: 'string', minLength: 1, maxLength: 100 }
        )
      ).toBe(false);
    });

    it('should handle pattern constraints', () => {
      expect(
        isMoreSpecific(
          { type: 'string', pattern: '^[a-z]+$' },
          { type: 'string', pattern: '^[a-z]+$' }
        )
      ).toBe(true);

      expect(
        isMoreSpecific(
          { type: 'string', pattern: '^[a-z]+$' },
          { type: 'string', pattern: '^[0-9]+$' }
        )
      ).toBe(false);
    });
  });

  describe('nested objects', () => {
    it('should handle deeply nested object properties', () => {
      expect(
        isMoreSpecific(
          {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                },
              },
            },
          },
          {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  name: { type: 'string', minLength: 1 },
                },
              },
            },
          }
        )
      ).toBe(true);
    });

    it('should handle complex nested arrays', () => {
      expect(
        isMoreSpecific(
          {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                },
              },
            },
          },
          {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                tags: {
                  type: 'array',
                  items: { type: 'string', minLength: 1 },
                  minItems: 1,
                },
              },
            },
          }
        )
      ).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle null/undefined schemas', () => {
      expect(isMoreSpecific(null as any, { type: 'string' })).toBe(false);
      expect(isMoreSpecific({ type: 'string' }, null as any)).toBe(false);
      expect(isMoreSpecific(undefined as any, { type: 'string' })).toBe(false);
      expect(isMoreSpecific({ type: 'string' }, undefined as any)).toBe(false);
    });

    it('should handle empty objects', () => {
      expect(isMoreSpecific({}, {})).toBe(true);
      expect(isMoreSpecific({ type: 'object' }, {})).toBe(true);
      expect(isMoreSpecific({}, { type: 'object' })).toBe(true);
    });

    it('should handle contradictory constraints', () => {
      expect(isMoreSpecific({ type: 'number', maximum: 10 }, { type: 'number', minimum: 20 })).toBe(
        false
      );

      expect(
        isMoreSpecific({ type: 'string', maxLength: 5 }, { type: 'string', minLength: 10 })
      ).toBe(false);

      expect(isMoreSpecific({ type: 'array', maxItems: 3 }, { type: 'array', minItems: 5 })).toBe(
        false
      );
    });
  });

  describe('real world examples', () => {
    it('should handle resolution schema example', () => {
      expect(
        isMoreSpecific(
          {
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
          },
          {
            $schema: 'http://json-schema.org/draft-07/schema#',
            type: 'object',
            properties: {
              type: { type: 'string', const: 'resolution' },
              title: { type: 'string' },
              questions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    description: { type: 'string' },
                    votes: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          personId: { type: 'string' },
                          createdAt: { type: 'string' },
                          vote: { type: 'string', enum: ['for', 'against', 'abstain'] },
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
            additionalProperties: false,
          }
        )
      ).toBe(true);
    });
  });
});

describe('createExtension', () => {
  describe('type compatibility', () => {
    it('should keep compatible types', () => {
      expect(createExtension({ type: 'number' }, { type: 'integer' })).toEqual({
        type: 'integer',
      });
    });

    it('should filter incompatible types', () => {
      expect(createExtension({ type: 'string' }, { type: 'number' })).toEqual({
        type: 'string',
      });
    });

    it('should handle array of types', () => {
      expect(
        createExtension({ type: ['string', 'number'] }, { type: ['number', 'integer'] })
      ).toEqual({
        type: ['integer'],
      });
    });
  });

  describe('numeric constraints', () => {
    it('should merge numeric ranges', () => {
      expect(
        createExtension(
          { type: 'number', minimum: 0, maximum: 100 },
          { type: 'number', minimum: 10, maximum: 50 }
        )
      ).toEqual({
        type: 'number',
        minimum: 10,
        maximum: 50,
      });
    });

    it('should handle multipleOf constraints', () => {
      expect(
        createExtension({ type: 'number', multipleOf: 2 }, { type: 'number', multipleOf: 4 })
      ).toEqual({
        type: 'number',
        multipleOf: 4,
      });
    });
  });

  describe('string constraints', () => {
    it('should merge string length constraints', () => {
      expect(
        createExtension(
          { type: 'string', minLength: 1, maxLength: 100 },
          { type: 'string', minLength: 5, maxLength: 50 }
        )
      ).toEqual({
        type: 'string',
        minLength: 5,
        maxLength: 50,
      });
    });

    it('should handle pattern constraints', () => {
      expect(
        createExtension(
          { type: 'string', pattern: '^[a-z]+$' },
          { type: 'string', pattern: '^[a-z]{3}$' }
        )
      ).toEqual({
        type: 'string',
        pattern: '^[a-z]{3}$',
      });
    });
  });

  describe('array constraints', () => {
    it('should merge array constraints', () => {
      expect(
        createExtension(
          {
            type: 'array',
            items: { type: 'number' },
            minItems: 1,
            maxItems: 10,
          },
          {
            type: 'array',
            items: { type: 'integer' },
            minItems: 2,
            maxItems: 5,
          }
        )
      ).toEqual({
        type: 'array',
        items: { type: 'integer' },
        minItems: 2,
        maxItems: 5,
      });
    });

    it('should handle uniqueItems constraint', () => {
      expect(
        createExtension({ type: 'array', uniqueItems: false }, { type: 'array', uniqueItems: true })
      ).toEqual({
        type: 'array',
        uniqueItems: true,
      });
    });
  });

  describe('object properties', () => {
    it('should merge object properties', () => {
      expect(
        createExtension(
          {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            required: ['name'],
          },
          {
            type: 'object',
            properties: {
              name: { type: 'string', minLength: 1 },
              age: { type: 'number' },
            },
            required: ['age'],
          }
        )
      ).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          age: { type: 'number' },
        },
        required: ['name', 'age'],
      });
    });

    it('should handle additionalProperties', () => {
      expect(
        createExtension(
          { type: 'object', additionalProperties: true },
          { type: 'object', additionalProperties: false }
        )
      ).toEqual({
        type: 'object',
        additionalProperties: false,
      });
    });
  });

  describe('enum values', () => {
    it('should merge enum values', () => {
      expect(
        createExtension(
          { type: 'string', enum: ['a', 'b', 'c'] },
          { type: 'string', enum: ['b', 'c', 'd'] }
        )
      ).toEqual({
        type: 'string',
        enum: ['b', 'c'],
      });
    });
  });

  describe('nested schemas', () => {
    it('should handle deeply nested schemas', () => {
      expect(
        createExtension(
          {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  preferences: {
                    type: 'object',
                    properties: {
                      theme: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
          {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  name: { type: 'string', minLength: 1 },
                  preferences: {
                    type: 'object',
                    properties: {
                      theme: { type: 'string', enum: ['light', 'dark'] },
                    },
                  },
                },
              },
            },
          }
        )
      ).toEqual({
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              name: { type: 'string', minLength: 1 },
              preferences: {
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

  describe('edge cases', () => {
    it('should handle null/undefined schemas', () => {
      expect(createExtension(null as any, { type: 'string' })).toEqual({ type: 'string' });
      expect(createExtension({ type: 'string' }, null as any)).toEqual({ type: 'string' });
      expect(createExtension(undefined as any, { type: 'string' })).toEqual({ type: 'string' });
      expect(createExtension({ type: 'string' }, undefined as any)).toEqual({ type: 'string' });
    });

    it('should handle empty objects', () => {
      expect(createExtension({}, {})).toEqual({});
      expect(createExtension({ type: 'object' }, {})).toEqual({ type: 'object' });
      expect(createExtension({}, { type: 'object' })).toEqual({ type: 'object' });
    });
  });

  describe('real world examples', () => {
    it('should handle resolution schema example', () => {
      const base = {
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
        type: 'object',
        properties: {
          type: { const: 'resolution' },
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                votes: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      vote: { type: 'string', enum: ['for', 'against', 'abstain'] },
                    },
                  },
                },
              },
            },
          },
        },
        additionalProperties: false,
      };

      const result = createExtension(base, delta);
      expect(isMoreSpecific(base, result)).toBe(true);
    });
  });
});
