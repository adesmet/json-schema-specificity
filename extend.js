/**
 * Recursively merge two objects (specializing in JSON Schema-like structures).
 *
 * @param {Object} base - The base (original) schema.
 * @param {Object} extension - The schema “delta” that adds or overrides fields.
 * @returns {Object} A new object representing the merged schema.
 */
function extendSchema(base, extension) {
  // If extension is not an object or is null/undefined, return the base as-is.
  if (typeof extension !== 'object' || extension === null || Array.isArray(extension)) {
    // If extension is primitive or array, override entirely.
    return extension === undefined ? base : extension;
  }

  // If base is not an object, or is null, we can’t merge into it—just return extension.
  if (typeof base !== 'object' || base === null || Array.isArray(base)) {
    return extension;
  }

  // Create a copy to avoid mutating the original base.
  const merged = { ...base };

  // Merge each key from extension into merged.
  for (const key of Object.keys(extension)) {
    // Recursively merge for object subfields, override otherwise.
    merged[key] = extendSchema(base[key], extension[key]);
  }

  return merged;
}

// ---- EXAMPLE USAGE ---- //

// Original schema
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

// Delta schema (partial)
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

// Extend/merge
const extendedSchema = extendSchema(original, delta);

console.log(JSON.stringify(extendedSchema, null, 2));
