interface JSONSchema {
  $schema?: string;
  type?: string | string[];
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  additionalProperties?: boolean;
  enum?: any[];
  const?: any;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  [key: string]: any; // Add index signature to allow any string key
}

/**
 * Recursively merge two objects (specializing in JSON Schema-like structures).
 *
 * @param {Object} base - The base (original) schema.
 * @param {Object} extension - The schema "delta" that adds or overrides fields.
 * @returns {Object} A new object representing the merged schema.
 */
export function extendSchema(base: JSONSchema, extension: JSONSchema): JSONSchema {
  // If extension is not an object or is null/undefined, return the base as-is.
  if (typeof extension !== 'object' || extension === null || Array.isArray(extension)) {
    // If extension is primitive or array, override entirely.
    return extension === undefined ? base : extension;
  }

  // If base is not an object, or is null, we can't merge into it—just return extension.
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

export default {
  extendSchema,
};
