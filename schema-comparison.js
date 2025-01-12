/**
 * Checks if an extension schema is more specific than the original schema
 * @param {Object} original - The original JSON schema
 * @param {Object} extension - The extension JSON schema to compare
 * @returns {boolean} - True if extension is more specific than original
 */
function isMoreSpecific(original, extension) {
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
                if ((extKey === origRequired || extension.required.includes(extKey)) &&
                    arePropertiesEquivalent(origSchema, extSchema)) {
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
            for (const [extKey, extSchema] of Object.entries(extension.properties || {})) {
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
        if (!extension.enum.every(val => original.enum.includes(val))) {
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
/**
 * Checks if two property schemas are equivalent in structure
 */
function arePropertiesEquivalent(prop1, prop2) {
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

function isTypeCompatible(originalType, extensionType) {
    if (originalType === extensionType) return true;
    
    // Check if extension type is more specific
    if (originalType === 'number' && extensionType === 'integer') return true;
    
    return false;
}

/**
 * Gets the effective minimum value from numeric constraints
 */
function getEffectiveMinimum(schema) {
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
function getEffectiveMaximum(schema) {
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
function areNumericConstraintsCompatible(original, extension) {
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
function areArrayConstraintsCompatible(original, extension) {
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
function areStringConstraintsCompatible(original, extension) {
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

// Test cases
function runTests() {
    // Test 1: Simple type compatibility
    console.log('Test 1:', isMoreSpecific(
        { type: 'number' },
        { type: 'integer' }
    )); // Should be true

    // Test 2: Required properties
    console.log('Test 2:', isMoreSpecific(
        { 
            type: 'object',
            required: ['name'],
            properties: { name: { type: 'string' } }
        },
        { 
            type: 'object',
            required: ['name', 'age'],
            properties: { 
                name: { type: 'string' },
                age: { type: 'number' }
            }
        }
    )); // Should be true

    // Test 3: Enum values
    console.log('Test 3:', isMoreSpecific(
        { type: 'string', enum: ['a', 'b', 'c'] },
        { type: 'string', enum: ['a', 'b'] }
    )); // Should be true

    // Test 4: Numeric constraints
    console.log('Test 4:', isMoreSpecific(
        { type: 'number', minimum: 0, maximum: 100 },
        { type: 'number', minimum: 10, maximum: 50 }
    )); // Should be true

    // Test 5: Array constraints
    console.log('Test 5:', isMoreSpecific(
        { 
            type: 'array',
            items: { type: 'number' },
            minItems: 1,
            maxItems: 10
        },
        { 
            type: 'array',
            items: { type: 'integer' },
            minItems: 2,
            maxItems: 5
        }
    )); // Should be true

    // Test 6: String constraints
    console.log('Test 6:', isMoreSpecific(
        { type: 'string', minLength: 1, maxLength: 100 },
        { type: 'string', minLength: 5, maxLength: 50 }
    )); // Should be true

    // Test 7: Incompatible changes
    console.log('Test 7:', isMoreSpecific(
        { type: 'integer' },
        { type: 'number' }
    )); // Should be false

    // Test 8: Nested object properties
    console.log('Test 8:', isMoreSpecific(
        {
            type: 'object',
            properties: {
                user: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' }
                    }
                }
            }
        },
        {
            type: 'object',
            properties: {
                user: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', minLength: 1 }
                    }
                }
            }
        }
    )); // Should be true

    // Test 9: Multiple type incompatibility
    console.log('Test 9:', isMoreSpecific(
        { type: ['string', 'number'] },
        { type: ['string', 'boolean'] }
    )); // Should be false

    // Test 10: Complex nested arrays
    console.log('Test 10:', isMoreSpecific(
        {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    tags: {
                        type: 'array',
                        items: { type: 'string' }
                    }
                }
            }
        },
        {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    tags: {
                        type: 'array',
                        items: { type: 'string', minLength: 1 },
                        minItems: 1
                    }
                }
            }
        }
    )); // Should be true

    // Test 11: Contradictory numeric constraints
    console.log('Test 11:', isMoreSpecific(
        {
            type: 'object',
            properties: {
                age: { type: 'number', maximum: 12 }
            }
        },
        {
            type: 'object',
            properties: {
                age: { type: 'number', minimum: 18 }
            }
        }
    )); // Should be false

    // Test 12: Contradictory string lengths
    console.log('Test 12:', isMoreSpecific(
        { type: 'string', maxLength: 5 },
        { type: 'string', minLength: 10 }
    )); // Should be false

    // Test 13: Contradictory array lengths
    console.log('Test 13:', isMoreSpecific(
        { type: 'array', maxItems: 3 },
        { type: 'array', minItems: 5 }
    )); // Should be false

    // Test 14: Empty enum after intersection
    console.log('Test 14:', isMoreSpecific(
        { type: 'string', enum: ['a', 'b', 'c'] },
        { type: 'string', enum: ['a', 'b'] }
    )); // Should be false

    console.log('Test 15:', isMoreSpecific({
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "properties": {
          "type": { "type": "string"},
          "title": { "type": "string" },
          "questions": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "title": { "type": "string" },
                "description": { "type": "string" },
                "votes": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "personId": { "type": "string" },
                      "createdAt": { "type": "string" },
                      "vote": { "type": "string" }
                    },
                    "required": ["personId", "createdAt", "vote"],
                    "additionalProperties": false
                  }
                }
              },
              "required": ["description", "votes"],
              "additionalProperties": false
            },
            "minItems": 1
          }
        },
        "required": ["type", "title", "questions"],
        "additionalProperties": true
      }, {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "properties": {
          "type": { "type": "string", "const": "resolution" },
          "title": { "type": "string" },
          "questions": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "description": { "type": "string" },
                "votes": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "personId": { "type": "string" },
                      "createdAt": { "type": "string" },
                      "vote": { "type": "string", "enum": ["for", "against", "abstain"] }
                    },
                    "required": ["personId", "createdAt", "vote"],
                    "additionalProperties": false
                  }
                }
              },
              "required": ["description", "votes"],
              "additionalProperties": false
            },
            "minItems": 1
          }
        },
        "required": ["type", "title", "questions"],
        "additionalProperties": false
      }))
}

// Run the tests
runTests();
