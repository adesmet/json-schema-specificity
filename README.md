# json-schema-specificity

A JavaScript library for working with JSON Schema specificity. This library helps you:
1. Determine if one JSON schema is more specific than another
2. Create extension schemas by specifying only the changes you want to make

## Live Demos

- [Schema Comparison Demo](https://adesmet.github.io/json-schema-specificity/) - Compare two schemas to check if one is more specific than the other
- [Extension Creator Demo](https://adesmet.github.io/json-schema-specificity/create-extension.html) - Create a more specific schema by providing only the changes you want to make

## Installation

```bash
npm install json-schema-specificity
```

## Usage

```javascript
import { isMoreSpecific } from 'json-schema-specificity';

const original = {
  type: 'object',
  properties: {
    name: { type: 'string' }
  }
};

const extension = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 }
  }
};

const result = isMoreSpecific(original, extension);
// result: true (because extension is more specific than original)
```

## API

### isMoreSpecific(original, extension)

Determines if the extension schema is more specific than the original schema.

#### Parameters

- `original` (Object): The original JSON schema
- `extension` (Object): The extension JSON schema to compare

#### Returns

- `boolean`: Returns `true` if the extension schema is more specific than the original schema, `false` otherwise.

### createExtension(base, delta)

Creates a new schema by merging a base schema with delta changes, ensuring the result is more specific than the base schema.

#### Parameters

- `base` (Object): The base JSON schema
- `delta` (Object): The delta changes to apply

#### Returns

- `Object`: A new schema that extends the base schema with the delta changes

## Features

- Supports JSON Schema Draft-07
- Handles various schema keywords:
  - Type compatibility (including number/integer relationships)
  - Required properties
  - Property constraints
  - Numeric constraints (minimum, maximum, multipleOf)
  - String constraints (minLength, maxLength, pattern)
  - Array constraints (minItems, maxItems, uniqueItems)
  - Enum values
  - Const values
  - Additional properties

## Examples

### Comparing Schema Specificity

#### Type Compatibility

```javascript
isMoreSpecific(
  { type: 'number' },
  { type: 'integer' }
); // true
```

#### Numeric Constraints

```javascript
isMoreSpecific(
  { type: 'number', minimum: 0, maximum: 100 },
  { type: 'number', minimum: 10, maximum: 50 }
); // true
```

#### Array Constraints

```javascript
isMoreSpecific(
  { type: 'array', items: { type: 'string' }, maxItems: 5 },
  { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 3 }
); // true
```

### Creating Extension Schemas

```javascript
import { createExtension } from 'json-schema-specificity';

const base = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' }
  }
};

const delta = {
  properties: {
    name: { minLength: 1 },
    age: { minimum: 0, maximum: 120 }
  }
};

const extension = createExtension(base, delta);
// Result:
// {
//   type: 'object',
//   properties: {
//     name: { type: 'string', minLength: 1 },
//     age: { type: 'number', minimum: 0, maximum: 120 }
//   }
// }
```

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
