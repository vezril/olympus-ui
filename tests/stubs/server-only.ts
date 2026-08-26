// The real `server-only` package throws unless it is resolved under the
// react-server condition. Under vitest the modules that import it ARE the
// server half, so stub it out rather than weakening the guard in app code.
export {};
