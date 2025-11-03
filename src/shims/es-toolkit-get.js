// Minimal shim for es-toolkit/compat/get expected by Recharts
// Implements a lodash.get-compatible function locally to avoid runtime import issues

function toPath(path) {
  if (Array.isArray(path)) return path;
  return String(path)
    .replace(/\[(\w+)\]/g, ".$1") // convert indexes to properties
    .replace(/^\./, "")
    .split(".");
}

function get(obj, path, defaultValue) {
  if (obj == null) return defaultValue;
  const keys = toPath(path);
  let result = obj;
  for (const key of keys) {
    if (result != null && Object.prototype.hasOwnProperty.call(result, key)) {
      result = result[key];
    } else {
      result = undefined;
      break;
    }
  }
  return result === undefined ? defaultValue : result;
}

export default get;
export { get };
