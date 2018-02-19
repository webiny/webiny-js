# webiny-sr-preset-webiny

This package is a preset for our `webiny-semantic-release` tool.

In addition to all the default plugins, it contains several more plugins for things we find worth checking before releasing an incomplete package:
- checks the `main` field of all packages and makes sure it points to `lib/` folder (sometimes we switch to `src` folder for debugging purposes and forget to revert).
- checks if all packages contain a `README.md` file
 
