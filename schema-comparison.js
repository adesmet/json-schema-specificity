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
            const origSchema = original.properties?.[origRequired];
            if (!origSchema) continue;

            let found = false;
            for (const [extKey, extSchema] of Object.entries(extension.properties || {})) {
                if (
                    (extKey === origRequired || extension.required.includes(extKey)) &&
                    arePropertiesEquivalent(origSchema, extSchema)
                ) {
                    found = true;
                    if (!isMoreSpecific(origSchema, extSchema)) {
                        return false;
                    }
                    break;
                }
            }
            if (!found) return false;
        }
    }

    // Compare all properties
    if (original.properties) {
        for (const [origKey, origSchema] of Object.entries(original.properties)) {
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
        if (!extension.enum.every((val) => original.enum.includes(val))) {
            return false;
        }
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

function isTypeCompatible(originalType, extensionType) {
    const origTypes = Array.isArray(originalType) ? originalType : [originalType];
    const extTypes = Array.isArray(extensionType) ? extensionType : [extensionType];

    return extTypes.every((extType) => {
        return origTypes.some((origType) => {
            if (origType === extType) return true;
            if (origType === 'number' && extType === 'integer') return true;
            return false;
        });
    });
}

function arePropertiesEquivalent(prop1, prop2) {
    if (!prop1 || !prop2) return false;

    if (prop1.type !== prop2.type) {
        if (!(prop1.type === 'number' && prop2.type === 'integer')) {
            return false;
        }
    }

    if (prop1.type === 'object' && prop2.type === 'object') {
        if (!prop1.properties || !prop2.properties) return false;

        const prop1Required = new Set(prop1.required || []);
        const prop2Required = new Set(prop2.required || []);

        for (const [key1, schema1] of Object.entries(prop1.properties)) {
            if (prop1Required.has(key1)) {
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

    if (prop1.type === 'array' && prop2.type === 'array') {
        if (!prop1.items || !prop2.items) return false;
        return arePropertiesEquivalent(prop1.items, prop2.items);
    }

    return true;
}

function getEffectiveMinimum(schema) {
    if (schema.minimum !== undefined) {
        return schema.minimum;
    }
    if (schema.exclusiveMinimum !== undefined) {
        return schema.exclusiveMinimum + 1;
    }
    return null;
}

function getEffectiveMaximum(schema) {
    if (schema.maximum !== undefined) {
        return schema.maximum;
    }
    if (schema.exclusiveMaximum !== undefined) {
        return schema.exclusiveMaximum - 1;
    }
    return null;
}

function areNumericConstraintsCompatible(original, extension) {
    const origMin = getEffectiveMinimum(original);
    const origMax = getEffectiveMaximum(original);
    const extMin = getEffectiveMinimum(extension);
    const extMax = getEffectiveMaximum(extension);

    if (origMin !== null && origMax !== null && origMin > origMax) return false;
    if (extMin !== null && extMax !== null && extMin > extMax) return false;

    if (origMin !== null && extMin !== null && extMin < origMin) return false;
    if (origMax !== null && extMax !== null && extMax > origMax) return false;

    if (origMax !== null && extMin !== null && extMin > origMax) return false;
    if (origMin !== null && extMax !== null && extMax < origMin) return false;

    if (original.multipleOf !== undefined && extension.multipleOf !== undefined) {
        if (extension.multipleOf % original.multipleOf !== 0) return false;
    }

    return true;
}

function areArrayConstraintsCompatible(original, extension) {
    const origMin = original.minItems ?? 0;
    const origMax = original.maxItems ?? Infinity;
    const extMin = extension.minItems ?? 0;
    const extMax = extension.maxItems ?? Infinity;

    if (origMin > origMax || extMin > extMax) return false;
    if (extMin < origMin || extMax > origMax) return false;
    if (extMin > origMax || origMin > extMax) return false;

    if (original.uniqueItems && !extension.uniqueItems) return false;

    if (original.items && extension.items) {
        if (!isMoreSpecific(original.items, extension.items)) return false;
    }

    return true;
}

function areStringConstraintsCompatible(original, extension) {
    const origMin = original.minLength ?? 0;
    const origMax = original.maxLength ?? Infinity;
    const extMin = extension.minLength ?? 0;
    const extMax = extension.maxLength ?? Infinity;

    if (origMin > origMax || extMin > extMax) return false;
    if (extMin < origMin || extMax > origMax) return false;
    if (extMin > origMax || origMin > extMax) return false;

    if (original.pattern && extension.pattern) {
        if (original.pattern !== extension.pattern) return false;
    }

    return true;
}
