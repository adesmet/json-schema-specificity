# json-schema-specificity

A JavaScript library for comparing JSON Schema specificity. This library helps determine if one JSON schema is more specific than another, meaning that any JSON document that would be validated by the extension schema would also be validated by the original schema.

## Live Demo

Try out the library with our [interactive demo](https://adesmet.github.io/json-schema-specificity/). The demo allows you to input two JSON schemas and instantly see if one is more specific than the other.

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

### Type Compatibility

```javascript
isMoreSpecific(
  { type: 'number' },
  { type: 'integer' }
); // true
```

### Numeric Constraints

```javascript
isMoreSpecific(
  { type: 'number', minimum: 0, maximum: 100 },
  { type: 'number', minimum: 10, maximum: 50 }
); // true
```

### Array Constraints

```javascript
isMoreSpecific(
  { type: 'array', items: { type: 'string' }, maxItems: 5 },
  { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 3 }
); // true
```

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
