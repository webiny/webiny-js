# No Inline Conditional Spreads In Object Literals

Don't build objects with inline conditional spreads (`...(cond ? { k: v } : {})`) or inline casts inside an object literal — it's hard to read. Declare the object first, then add the conditional keys with plain `if` statements.

```ts
// Bad
const permissions = {
  contents: "read",
  ...(awsAuth ? { "id-token": "write" } : {}),
  ...((extra as Record<string, string> | undefined) ?? {})
};
```

```ts
// Good
const permissions: Record<string, string> = { contents: "read" };
if (awsAuth) {
  permissions["id-token"] = "write";
}
if (extra) {
  Object.assign(permissions, extra);
}
```
