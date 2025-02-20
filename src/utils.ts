/**
 * Gets the length of an enum object.
 */
export const getEnumLength = <T extends Record<string, number | string>>(
  enumObj: T,
): number => {
  return Object.keys(enumObj).filter((key) => isNaN(Number(key))).length; // excludes reverse mappings for numeric enums
};
