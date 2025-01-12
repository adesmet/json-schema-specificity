import { isMoreSpecific } from './index';

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
