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
}

/**
 * Checks if an extension schema is more specific than the original schema
 * @param original - The original JSON schema
 * @param extension - The extension JSON schema to compare
 * @returns True if extension is more specific than original
 */
export function isMoreSpecific(original: JSONSchema, extension: JSONSchema): boolean {
  // Handle null/undefined schemas
  if (!original || !extension) return false;

  // Compare types
  if (original.type && extension.type) {
    if (!isTypeCompatible(original.type, extension.type)) {
      return false;
    }
  }

  // Compare const values
  if (original.const !== undefined) {
    if (extension.const === undefined || extension.const !== original.const) {
      return false;
    }
  }

  // Compare required properties and their schemas
  if (original.required && extension.required) {
    for (const origRequired of original.required) {
      // Find the corresponding property in extension
      const origSchema = original.properties?.[origRequired];
      if (!origSchema) continue;

      // Look for either exact match or equivalent property
      let found = false;
      for (const [extKey, extSchema] of Object.entries(extension.properties || {})) {
        if (
          (extKey === origRequired || extension.required.includes(extKey)) &&
          arePropertiesEquivalent(origSchema, extSchema)
        ) {
          found = true;
          // Check if the found property is more specific
          if (!isMoreSpecific(origSchema, extSchema)) {
            return false;
          }
          break;
        }
      }
      if (!found) return false;
    }
  }

  // Compare all properties (including non-required ones)
  if (original.properties) {
    for (const [origKey, origSchema] of Object.entries(original.properties)) {
      // Find matching property in extension (by name or structure)
      let found = false;
      for (const [, extSchema] of Object.entries(extension.properties || {})) {
        if (arePropertiesEquivalent(origSchema, extSchema)) {
          if (!isMoreSpecific(origSchema, extSchema)) {
            return false;
          }
          found = true;
          break;
        }
      }
      if (!found && original.required?.includes(origKey)) {
        return false;
      }
    }
  }

  // Compare additionalProperties
  if (original.additionalProperties === false) {
    if (extension.additionalProperties !== false) {
      return false;
    }
  }

  // Compare enum values
  if (original.enum && extension.enum) {
    // Extension enum must be subset of original enum
    if (!extension.enum.every((val) => original.enum!.includes(val))) {
      return false;
    }
    // Check for empty enum after intersection
    if (extension.enum.length === 0) return false;
  }

  // Compare numeric constraints
  if (original.type === 'number' || original.type === 'integer') {
    if (!areNumericConstraintsCompatible(original, extension)) {
      return false;
    }
  }

  // Compare array constraints
  if (original.type === 'array') {
    if (!areArrayConstraintsCompatible(original, extension)) {
      return false;
    }
  }

  // Compare string constraints
  if (original.type === 'string') {
    if (!areStringConstraintsCompatible(original, extension)) {
      return false;
    }
  }

  return true;
}

/**
 * Checks if extension type is compatible with original type
 */
function isTypeCompatible(
  originalType: string | string[],
  extensionType: string | string[]
): boolean {
  const origTypes = Array.isArray(originalType) ? originalType : [originalType];
  const extTypes = Array.isArray(extensionType) ? extensionType : [extensionType];

  // Check each extension type against original types
  return extTypes.every((extType) => {
    return origTypes.some((origType) => {
      if (origType === extType) return true;
      // Special case: number can be specialized to integer
      if (origType === 'number' && extType === 'integer') return true;
      return false;
    });
  });
}

/**
 * Checks if two property schemas are equivalent in structure
 */
function arePropertiesEquivalent(prop1: JSONSchema, prop2: JSONSchema): boolean {
  if (!prop1 || !prop2) return false;

  // Check basic type compatibility
  if (prop1.type !== prop2.type) {
    if (!(prop1.type === 'number' && prop2.type === 'integer')) {
      return false;
    }
  }

  // For objects, check property structure
  if (prop1.type === 'object' && prop2.type === 'object') {
    if (!prop1.properties || !prop2.properties) return false;

    // Check if required properties match in structure
    const prop1Required = new Set(prop1.required || []);
    const prop2Required = new Set(prop2.required || []);

    for (const [key1, schema1] of Object.entries(prop1.properties)) {
      if (prop1Required.has(key1)) {
        // Find matching required property in prop2
        let found = false;
        for (const [key2, schema2] of Object.entries(prop2.properties)) {
          if (prop2Required.has(key2) && arePropertiesEquivalent(schema1, schema2)) {
            found = true;
            break;
          }
        }
        if (!found) return false;
      }
    }
  }

  // For arrays, check item structure
  if (prop1.type === 'array' && prop2.type === 'array') {
    if (!prop1.items || !prop2.items) return false;
    return arePropertiesEquivalent(prop1.items, prop2.items);
  }

  return true;
}

/**
 * Gets the effective minimum value from numeric constraints
 */
function getEffectiveMinimum(schema: JSONSchema): number | null {
  if (schema.minimum !== undefined) {
    return schema.minimum;
  }
  if (schema.exclusiveMinimum !== undefined) {
    return schema.exclusiveMinimum + 1;
  }
  return null;
}

/**
 * Gets the effective maximum value from numeric constraints
 */
function getEffectiveMaximum(schema: JSONSchema): number | null {
  if (schema.maximum !== undefined) {
    return schema.maximum;
  }
  if (schema.exclusiveMaximum !== undefined) {
    return schema.exclusiveMaximum - 1;
  }
  return null;
}

/**
 * Checks if numeric constraints in extension are compatible with original
 */
function areNumericConstraintsCompatible(original: JSONSchema, extension: JSONSchema): boolean {
  // Get effective min/max from both schemas
  const origMin = getEffectiveMinimum(original);
  const origMax = getEffectiveMaximum(original);
  const extMin = getEffectiveMinimum(extension);
  const extMax = getEffectiveMaximum(extension);

  // Check if ranges are contradictory within themselves
  if (origMin !== null && origMax !== null && origMin > origMax) return false;
  if (extMin !== null && extMax !== null && extMin > extMax) return false;

  // Check if extension range is within original range
  if (origMin !== null && extMin !== null && extMin < origMin) return false;
  if (origMax !== null && extMax !== null && extMax > origMax) return false;

  // Check if extension range contradicts original range
  if (origMax !== null && extMin !== null && extMin > origMax) return false;
  if (origMin !== null && extMax !== null && extMax < origMin) return false;

  // Check multipleOf
  if (original.multipleOf !== undefined && extension.multipleOf !== undefined) {
    // Extension multipleOf should be a multiple of original multipleOf
    if (extension.multipleOf % original.multipleOf !== 0) return false;
  }

  return true;
}

/**
 * Checks if array constraints in extension are compatible with original
 */
function areArrayConstraintsCompatible(original: JSONSchema, extension: JSONSchema): boolean {
  // Get effective min/max items
  const origMin = original.minItems ?? 0;
  const origMax = original.maxItems ?? Infinity;
  const extMin = extension.minItems ?? 0;
  const extMax = extension.maxItems ?? Infinity;

  // Check for contradictions
  if (origMin > origMax || extMin > extMax) return false;
  if (extMin < origMin || extMax > origMax) return false;
  if (extMin > origMax || origMin > extMax) return false;

  // Check uniqueItems
  if (original.uniqueItems && !extension.uniqueItems) return false;

  // Check items schema
  if (original.items && extension.items) {
    if (!isMoreSpecific(original.items, extension.items)) return false;
  }

  return true;
}

/**
 * Checks if string constraints in extension are compatible with original
 */
function areStringConstraintsCompatible(original: JSONSchema, extension: JSONSchema): boolean {
  // Get effective min/max lengths
  const origMin = original.minLength ?? 0;
  const origMax = original.maxLength ?? Infinity;
  const extMin = extension.minLength ?? 0;
  const extMax = extension.maxLength ?? Infinity;

  // Check for contradictions
  if (origMin > origMax || extMin > extMax) return false;
  if (extMin < origMin || extMax > origMax) return false;
  if (extMin > origMax || origMin > extMax) return false;

  // Check pattern
  if (original.pattern && extension.pattern) {
    // This is a simplified check - in reality, we'd need to check if extension pattern
    // is more restrictive than original pattern, which is a complex problem
    if (original.pattern !== extension.pattern) return false;
  }

  return true;
}
