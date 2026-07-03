# check:test:types

Type-checks `__tests__/` files across all packages (or specific ones).

## Usage

```bash
# All packages, write reports to docs/.reports/
yarn check:test:types

# Single package, print errors to stdout
yarn check:test:types -p api-headless-cms --report cli

# Multiple packages, comma-separated
yarn check:test:types -p handler-aws,plugins --report cli
```

## Flags

| Flag            | Description                                                          |
| --------------- | -------------------------------------------------------------------- |
| `-p, --package` | Folder name(s) to check, comma-separated. Omit to check all.         |
| `--report`      | `file` (default) writes to `docs/.reports/`. `cli` prints to stdout. |
