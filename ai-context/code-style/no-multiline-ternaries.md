# No Multi-Line Ternaries

A ternary is fine when the whole thing fits on one line and reads at a glance. The moment it has to
wrap, nests another ternary, or carries a callback, use `if` statements instead.

Formatting hides the cost: oxfmt will happily lay a ternary across three or four lines with the `?`
and `:` at the start of each, which looks tidy but forces the reader to reassemble the expression
before they can tell what the value is.

```ts
// Bad — wraps, and the condition, the callback and the fallback are on different lines.
const tags = Array.isArray(value.tags)
  ? value.tags.filter((tag: unknown): tag is string => typeof tag === "string" && tag !== "")
  : [];
```

```ts
// Bad — nested, so each branch has to be traced separately.
const body =
  body === undefined || body === null ? "" : typeof body === "string" ? body : JSON.stringify(body);
```

```ts
// Good — the shape of the result is obvious, and each condition stands alone.
const tags: string[] = [];

if (Array.isArray(value.tags)) {
  for (const tag of value.tags) {
    if (typeof tag === "string" && tag !== "") {
      tags.push(tag);
    }
  }
}
```

```ts
// Good — a short single-line ternary is still the clearest option.
const description = typeof value.description === "string" ? value.description : "";
```

For a chain of conditions producing one value, a function with early returns beats both:

```ts
function encodeBody(body: unknown): string {
  if (body === undefined || body === null) {
    return "";
  }
  if (typeof body === "string") {
    return body;
  }
  return JSON.stringify(body);
}
```

Same reasoning as [no-inline-conditional-spreads.md](./no-inline-conditional-spreads.md) and
[no-nested-call-arguments.md](./no-nested-call-arguments.md): name the steps, don't make the reader
unpack one expression.
