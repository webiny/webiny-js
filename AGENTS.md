## Plan Mode
1. Make the plan extremely concise. Sacrifice grammar for the sake of concision.
2. At the end of each plan, give me a list of unresolved questions to answer, if any.

### Code
1. When writing comments, use `//` for single-line comments and `/* ... */` for multi-line comments. Always end comments with a period.

### Building
1. When building a single package, use `yarn build -p <package-name>`, for example `yarn build -p @webiny/api-core`.
2. To build all packages, simply run `yarn build`.
3. To build all packages without caching, use `yarn build --no-cache`.

### Commits
1. Do not commit by yourself when on local machine. I'll do it.
1. Avoid overly verbose descriptions or unnecessary details.
2. Use conventional commit message formats like:
   - feat: for new features
   - fix: for bug fixes
   - docs: for documentation changes

### Misc.
1. When generating code, once done, run "git add ." to stage all changes.