// Firefox exposes the promise based `browser.*` API, Chrome (MV3) exposes the
// same promise based API as `chrome.*`. Both are used the same way here, so no
// polyfill is needed.
export const ext = globalThis.browser ?? globalThis.chrome;
