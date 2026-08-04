# No console.* In Backend Code

Never use `console.log` / `console.warn` / `console.error` in backend (`api-*`) code. Use the DI logger.

Inject `Logger` (from `@webiny/api-core/features/logger`) as a dependency and call `logger.info/warn/error(...)`. It is pino-backed and takes `(objOrMsg, ...args)` — pass structured context as the first arg.

```ts
// Good
logger.warn({ error }, "message");
```

```ts
// Bad
console.warn("message", error);
```
