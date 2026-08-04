# Compose CSS Class Names With A Helper

Compose CSS class names with a helper, never string concatenation (`+`) or template literals.

- In packages that depend on `@webiny/admin-ui`, use its `cn` helper (`clsx` + `tailwind-merge`).
- In admin-ui-agnostic packages (e.g. `@webiny/lexical-editor`), import `clsx` directly but alias it as `cn` — `import cn from "clsx"` — so the call site reads the same everywhere.

```ts
// Good
className={cn("base", isActive && "active", className)}
```

```ts
// Bad
className={"base " + (isActive ? "active " : "") + className}
className={`base ${isActive ? "active" : ""} ${className}`}
```
