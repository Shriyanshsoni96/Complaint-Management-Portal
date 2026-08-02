// Drops empty/falsy values so they aren't sent as literal empty query params.
export function toQueryParams(filters) {
  const params = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params[key] = value;
  });
  return params;
}
