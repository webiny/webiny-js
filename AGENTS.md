### Building
1. When building a single package, use `yarn build -p <package-name>`, for example `yarn build -p @webiny/api-core`.
2. To build all packages, simply run `yarn build`.
3. To build all packages without caching, use `yarn build --no-cache`.

### Commit Messages
1. Avoid overly verbose descriptions or unnecessary details.
2. Use conventional commit message formats like:
   - feat: for new features
   - fix: for bug fixes
   - docs: for documentation changes

### Misc.
1. When generating code, once done, run "git add ." to stage all changes.