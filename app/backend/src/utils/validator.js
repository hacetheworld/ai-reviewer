export function requireString(value, fieldName) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return `${fieldName} is required`;
  }
  return null;
}

export function jsonSuccess(data) {
  return { success: true, data };
}

export function jsonError(error) {
  return { success: false, error };
}
