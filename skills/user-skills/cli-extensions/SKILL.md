---
name: webiny-cli-extensions
context: webiny-extensions
description: >
  Adding custom commands to the Webiny CLI using CliCommandFactory.
  Use this skill when the developer wants to create a custom CLI command, add a data migration
  script, build a code generator, create deployment scripts, export CMS content, or add
  health check commands. Covers CliCommandFactory.Interface, command definition, typed
  parameters, the Ui service for terminal output, and registration via <Cli.Command>.
---

# CLI Extensions

## TL;DR

Add custom commands to the Webiny CLI using the `CliCommandFactory` pattern. Define a class implementing `CliCommandFactory.Interface<TParams>`, specify command name, description, params, and handler, then export with `CliCommandFactory.createImplementation()`. Register in `webiny.config.tsx` via `<Cli.Command>`.

## The CliCommandFactory Pattern

```typescript
// extensions/MyCustomCommand.ts
import { Ui } from "webiny/cli";
import { CliCommandFactory } from "webiny/cli/command";

export interface IMyCustomCommandParams {
  name: string;
}

class MyCustomCommandImpl implements CliCommandFactory.Interface<IMyCustomCommandParams> {
  constructor(private ui: Ui.Interface) {}

  execute(): CliCommandFactory.CommandDefinition<IMyCustomCommandParams> {
    return {
      name: "my-custom-command",
      description: "This is my custom command",
      examples: ["$0 my-custom-command test1", "$0 my-custom-command test2"],
      params: [
        {
          name: "name",
          description: "Your name",
          type: "string"
        }
      ],
      handler: async params => {
        this.ui.info("Starting my custom command...");
        this.ui.emptyLine();
        this.ui.success(`Hello, ${params.name}! This is my custom command.`);
      }
    };
  }
}

export default CliCommandFactory.createImplementation({
  implementation: MyCustomCommandImpl,
  dependencies: [Ui]
});
```

Register in `webiny.config.tsx` (**YOU MUST include the `.ts` file extension in the `src` prop** — omitting it will cause a build failure):

```tsx
<Cli.Command src={"/extensions/MyCustomCommand.ts"} />
```

Run it:

```bash
yarn webiny my-custom-command "World"
```

## Command Definition Properties

| Property      | Type                                 | Description                                                    |
| ------------- | ------------------------------------ | -------------------------------------------------------------- |
| `name`        | `string`                             | The command name used on the CLI (e.g., `"my-custom-command"`) |
| `description` | `string`                             | Help text shown when listing commands                          |
| `examples`    | `string[]`                           | Usage examples (`$0` is replaced with the CLI binary name)     |
| `params`      | `ParamDefinition[]`                  | Positional parameters and options                              |
| `handler`     | `(params: TParams) => Promise<void>` | The function that executes the command                         |

## Parameter Definition

Each param in the `params` array:

| Property      | Type                                | Description                                                  |
| ------------- | ----------------------------------- | ------------------------------------------------------------ |
| `name`        | `string`                            | Parameter name (matches the key in your `TParams` interface) |
| `description` | `string`                            | Help text for this parameter                                 |
| `type`        | `"string" \| "number" \| "boolean"` | Parameter value type                                         |

## The `Ui` Service

Inject `Ui` for formatted terminal output:

```typescript
import { Ui } from "webiny/cli";
```

| Method                       | Description                      |
| ---------------------------- | -------------------------------- |
| `this.ui.info("message")`    | Print an info message (blue)     |
| `this.ui.success("message")` | Print a success message (green)  |
| `this.ui.warning("message")` | Print a warning message (yellow) |
| `this.ui.error("message")`   | Print an error message (red)     |
| `this.ui.emptyLine()`        | Print a blank line for spacing   |

## Use Cases

- **Data migrations** -- Scripts to migrate or seed CMS data
- **Code generators** -- Generate boilerplate extension files
- **Deployment scripts** -- Custom deployment workflows
- **Data exports** -- Export CMS content to files
- **Health checks** -- Verify infrastructure or API status

## Quick Reference

```
Import:          import { CliCommandFactory } from "webiny/cli/command";
Ui import:       import { Ui } from "webiny/cli";
Interface:       CliCommandFactory.Interface<TParams>
Definition:      CliCommandFactory.CommandDefinition<TParams>
Export:          CliCommandFactory.createImplementation({ implementation, dependencies })
Register:        <Cli.Command src={"/extensions/MyCommand.ts"} />
Run:             yarn webiny <command-name> [args]
```

## Related Skills

- `webiny-dependency-injection` -- The `createImplementation` pattern and available injectable services
- `webiny-project-structure` -- How to register CLI commands in `webiny.config.tsx`
- `webiny-full-stack-architect` -- Full-stack extensions that may include CLI commands alongside API and Admin
