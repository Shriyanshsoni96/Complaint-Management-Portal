export function getAssetUrl(path) {
  if (!path) return '';
  return `${import.meta.env.VITE_SOCKET_URL}${path}`;
}
