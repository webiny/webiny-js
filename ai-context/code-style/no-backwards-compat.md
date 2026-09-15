# No Backwards Compatibility On Refactor

When refactoring, we don't care about backwards compatibility, unless explicitly stated in the prompt.

- Delete old code paths outright; don't keep shims, deprecated aliases, or fallback branches.
- Keep compatibility only when the prompt explicitly asks for it.
