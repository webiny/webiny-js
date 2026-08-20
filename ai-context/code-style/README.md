# Code Style Rules

One rule per file. Each file states a single convention in `Do this / don't do this` form, like an ESLint rule.

Read every rule in this folder before writing or editing code.

| Rule                                                                                         | Summary                                                                    |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| [comments.md](./comments.md)                                                                 | `//` single-line, `/* */` multi-line, end with a period.                   |
| [es-modules.md](./es-modules.md)                                                             | Use `import`/`export`, not CommonJS `require`.                             |
| [one-import-per-line.md](./one-import-per-line.md)                                           | Only one named import per line.                                            |
| [one-class-per-file.md](./one-class-per-file.md)                                             | One file MUST contain only one class.                                      |
| [no-backwards-compat.md](./no-backwards-compat.md)                                           | Refactors ignore backwards compatibility unless the prompt says otherwise. |
| [no-console-in-backend.md](./no-console-in-backend.md)                                       | No `console.*` in `api-*` code; use the DI `Logger`.                       |
| [no-inline-class-in-create-implementation.md](./no-inline-class-in-create-implementation.md) | Declare implementation classes separately with an `implements` clause.     |
| [compose-css-class-names.md](./compose-css-class-names.md)                                   | Compose class names with a `cn` helper, never `+` or template literals.    |
| [no-inline-conditional-spreads.md](./no-inline-conditional-spreads.md)                       | Build objects with `if` statements, not inline conditional spreads/casts.  |
| [no-nested-call-arguments.md](./no-nested-call-arguments.md)                                 | Name each step; don't nest calls as arguments to other calls.              |

When adding a new code-style rule, create a new `*.md` file here (one rule per file) and add it to the table above.
