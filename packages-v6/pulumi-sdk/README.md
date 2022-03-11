# @webiny/pulumi-sdk
[![](https://img.shields.io/npm/dw/@webiny/pulumi-sdk.svg)](https://www.npmjs.com/package/@webiny/pulumi-sdk) 
[![](https://img.shields.io/npm/v/@webiny/pulumi-sdk.svg)](https://www.npmjs.com/package/@webiny/pulumi-sdk)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

A simple Pulumi Node.JS SDK - programmatically execute Pulumi CLI commands within your Node.js scripts.
  
### Example

```ts
const { Pulumi } = require("@webiny/pulumi-sdk");

// Create a new instance of Pulumi class.
// Note that Pulumi will be installed automatically on first use, you don't need to install it
// manually first. That's why the `beforePulumiInstall` and `afterPulumiInstall` are exposed.
const pulumi = new Pulumi({
  execa: {
    cwd: stacksDir,
    env: { PULUMI_CONFIG_PASSPHRASE: process.env.PULUMI_CONFIG_PASSPHRASE }
  },
  args: {
    secretsProvider: "passphrase"
  },
  beforePulumiInstall: () => {
    console.log(
      `💡 It looks like this is your first time using ${green(
        "@webiny/pulumi-sdk"
      )}.`
    );
    spinner.start(`Downloading Pulumi...`);
  },
  afterPulumiInstall: () => {
    spinner.stopAndPersist({
      symbol: green("✔"),
      text: `Pulumi downloaded, continuing...`
    });
  }
});

// Use existing stack if possible, otherwise create a new one.
let stackExists = true;
try {
  const { process } = await pulumi.run({ command: ["stack", "select", env] });
  await process;
} catch (e) {
  stackExists = false;
}

if (!stackExists) {
  const { process } = await pulumi.run({ command: ["stack", "init", env] });
  await process;
}

// If isPreview was set to true in our script, then run `preview` command, otherwise `up`.
if (isPreview) {
  const pulumi = new Pulumi();
  const { toConsole } = await pulumi.run({
    command: "preview",
    execa: {
      cwd: stacksDir,
      env: { PULUMI_CONFIG_PASSPHRASE: process.env.PULUMI_CONFIG_PASSPHRASE }
    }
  });
  await toConsole();
} else {
  const { toConsole } = await pulumi.run({
    command: "up",
    args: {
      yes: true,
      skipPreview: true
    }
  });
  await toConsole();
}
```

### Development

#### Updating versions
Currently, versions of the Pulumi code are hard-coded. For example, the version of Pulumi CLI we're currently downloading is set to `2.16.2`, the AWS plugin `3.22.0`. We define these in a couple of places:

1. In `src/index.ts`, check `AWS_PLUGIN_VERSION`.
2. In `src/downloadBinaries.ts`, check `PULUMI_VERSION`.
3. Finally, in `package.json`, we have the `@pulumi/aws` and `@pulumi/pulumi` in `dependencies`.

When updating versions, make sure the versions in `package.json` and in files mentioned in `1` and `2`, are synced.

And of course, once you change the version, please test with current dev repo at least. Everything should still be deployable from scratch. 
