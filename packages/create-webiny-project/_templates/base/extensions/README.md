## The `extensions` Folder

The extensions folder is the dedicated home for all extension implementations in your project.
While webiny.config.tsx (located in the project root) is responsible for registering extensions, the actual implementation code always lives inside this folder.

This structure keeps your project organized by separating:
•	Extension registration → in webiny.config.tsx
•	Extension implementation → in ./extensions

By keeping all implementations in one place, it becomes easier to maintain, share, and scale your custom logic across the project.

Learn more: https://webiny.link/extensions.
