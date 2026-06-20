# check:test:types

Type-checks `__tests__/` files across all packages (or specific ones).

## Usage

```bash
# All packages, write reports to docs/.reports/
yarn check:test:types

# Single package, print errors to stdout
yarn check:test:types -p @webiny/api-headless-cms --report cli

# Multiple packages
yarn check:test:types -p @webiny/handler-aws -p @webiny/plugins --report cli
```

## Flags

| Flag | Description |
|------|-------------|
| `-p, --package` | Package name(s) to check. Omit to check all. |
| `--report` | `file` (default) writes to `docs/.reports/`. `cli` prints to stdout. |
