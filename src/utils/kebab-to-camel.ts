/**
 * Converts a kebab-case string to camelCase
 * @param str - The kebab-case string to convert
 * @returns The camelCase string
 */
export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Converts an object with kebab-case keys to camelCase keys
 * @param obj - The object to convert
 * @returns A new object with camelCase keys
 */
export function convertKebabToCamel<T extends Record<string, unknown>>(
  obj: T,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = kebabToCamel(key);
    result[camelKey] = value;
  }
  return result;
}
