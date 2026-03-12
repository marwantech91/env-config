type SchemaType = 'string' | 'number' | 'boolean' | 'array' | 'json' | 'url' | 'enum';

interface SchemaField {
  type: SchemaType;
  required: boolean;
  defaultValue?: unknown;
  enumValues?: string[];
  validator?: (value: unknown) => boolean;
}

class SchemaBuilder {
  private field: SchemaField = { type: 'string', required: true };

  string(): this {
    this.field.type = 'string';
    return this;
  }

  number(): this {
    this.field.type = 'number';
    return this;
  }

  boolean(): this {
    this.field.type = 'boolean';
    return this;
  }

  array(): this {
    this.field.type = 'array';
    return this;
  }

  json(): this {
    this.field.type = 'json';
    return this;
  }

  url(): this {
    this.field.type = 'url';
    return this;
  }

  enum(values: string[]): this {
    this.field.type = 'enum';
    this.field.enumValues = values;
    return this;
  }

  default(value: unknown): this {
    this.field.defaultValue = value;
    this.field.required = false;
    return this;
  }

  optional(): this {
    this.field.required = false;
    return this;
  }

  validate(fn: (value: unknown) => boolean): this {
    this.field.validator = fn;
    return this;
  }

  build(): SchemaField {
    return this.field;
  }
}

export const z = {
  string: () => new SchemaBuilder().string(),
  number: () => new SchemaBuilder().number(),
  boolean: () => new SchemaBuilder().boolean(),
  array: () => new SchemaBuilder().array(),
  json: () => new SchemaBuilder().json(),
  url: () => new SchemaBuilder().url(),
  enum: (values: string[]) => new SchemaBuilder().enum(values),
};

function parseValue(value: string, field: SchemaField): unknown {
  switch (field.type) {
    case 'number': {
      const num = Number(value);
      if (isNaN(num)) throw new Error(`Expected number, got "${value}"`);
      return num;
    }
    case 'boolean':
      return value === 'true' || value === '1';
    case 'array':
      return value.split(',').map((s) => s.trim());
    case 'json':
      return JSON.parse(value);
    case 'url':
      new URL(value); // Throws if invalid
      return value;
    case 'enum':
      if (!field.enumValues?.includes(value)) {
        throw new Error(`Expected one of [${field.enumValues?.join(', ')}], got "${value}"`);
      }
      return value;
    default:
      return value;
  }
}

/**
 * Print all config values (redacting sensitive keys)
 */
export function printConfig(
  config: Record<string, unknown>,
  sensitiveKeys: string[] = ['SECRET', 'PASSWORD', 'TOKEN', 'KEY', 'PRIVATE']
): void {
  for (const [key, value] of Object.entries(config)) {
    const isSensitive = sensitiveKeys.some((s) => key.toUpperCase().includes(s));
    console.log(`  ${key}=${isSensitive ? '***' : value}`);
  }
}

export function defineConfig<T extends Record<string, SchemaBuilder>>(
  schema: T
): { [K in keyof T]: unknown } {
  const errors: string[] = [];
  const result: Record<string, unknown> = {};

  for (const [key, builder] of Object.entries(schema)) {
    const field = builder.build();
    const envValue = process.env[key];

    if (envValue === undefined || envValue === '') {
      if (field.required) {
        errors.push(`${key}: Required`);
        continue;
      }
      result[key] = field.defaultValue;
      continue;
    }

    try {
      const parsed = parseValue(envValue, field);

      if (field.validator && !field.validator(parsed)) {
        errors.push(`${key}: Validation failed`);
        continue;
      }

      result[key] = parsed;
    } catch (error) {
      errors.push(`${key}: ${(error as Error).message}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n  - ${errors.join('\n  - ')}`);
  }

  return result as { [K in keyof T]: unknown };
}
