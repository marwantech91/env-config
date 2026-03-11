# Env Config

![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

Type-safe environment configuration with validation and defaults for Node.js applications.

## Features

- **Type Safe** - Full TypeScript inference
- **Validation** - Validate required vars at startup
- **Defaults** - Define default values
- **Transform** - Parse numbers, booleans, arrays
- **Fail Fast** - Throw on missing required vars
- **Zero Runtime Deps** - Lightweight

## Installation

```bash
npm install @marwantech/env-config
```

## Quick Start

```typescript
import { defineConfig, z } from '@marwantech/env-config';

const config = defineConfig({
  PORT: z.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string(),
  API_KEY: z.string(),
  DEBUG: z.boolean().default(false),
  ALLOWED_ORIGINS: z.array().default([]),
});

// TypeScript knows the types!
console.log(config.PORT);        // number
console.log(config.NODE_ENV);    // 'development' | 'production' | 'test'
console.log(config.DATABASE_URL); // string
console.log(config.DEBUG);        // boolean
```

## Schema Types

```typescript
import { z } from '@marwantech/env-config';

z.string()              // String value
z.number()              // Parsed as number
z.boolean()             // 'true'/'false'/0/1
z.enum(['a', 'b'])      // One of values
z.array()               // Comma-separated array
z.json()                // JSON parsed
z.url()                 // Validated URL

// With defaults
z.string().default('value')
z.number().default(3000)

// Optional (won't throw if missing)
z.string().optional()

// Custom validation
z.string().validate((val) => val.length > 5)
```

## Example Config

```typescript
// config.ts
import { defineConfig, z } from '@marwantech/env-config';

export const config = defineConfig({
  // Server
  PORT: z.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string(),
  DATABASE_POOL_SIZE: z.number().default(10),

  // Auth
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // External Services
  REDIS_URL: z.string().optional(),
  SENTRY_DSN: z.string().optional(),

  // Feature Flags
  ENABLE_CACHE: z.boolean().default(true),
  ALLOWED_ORIGINS: z.array().default(['http://localhost:3000']),
});

// Usage
import { config } from './config';

app.listen(config.PORT);
```

## Validation Errors

```
Error: Environment validation failed:
  - DATABASE_URL: Required
  - JWT_SECRET: Required
  - PORT: Expected number, got "abc"
```

## License

MIT
