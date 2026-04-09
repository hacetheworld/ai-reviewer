export function info(message, meta) {
  if (meta !== undefined) {
    console.log(`[info] ${message}`, meta);
    return;
  }
  console.log(`[info] ${message}`);
}

export function warn(message, meta) {
  if (meta !== undefined) {
    console.warn(`[warn] ${message}`, meta);
    return;
  }
  console.warn(`[warn] ${message}`);
}

export function error(message, meta) {
  if (meta !== undefined) {
    console.error(`[error] ${message}`, meta);
    return;
  }
  console.error(`[error] ${message}`);
}
