export const pick = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Record<K, any> => {
  const finalObj: Record<string, any> = {};

  for (const key of keys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
      finalObj[key as string] = obj[key];
    }
  }

  return finalObj as Record<K, any>;
};
