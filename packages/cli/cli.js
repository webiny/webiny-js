#!/usr/bin/env node
const yargs = require("yargs");
const { blue, green, dim } = require("chalk");
const inquirer = require("inquirer");
const execa = require("execa");
const { PluginsContainer } = require("@webiny/plugins");

const trackingNotice = () => {
          console.log();
          console.log(
                    `Webiny collects anonymous usage analytics to help improve the developer experience.`
          );
          console.log(
                    `If you'd like to opt-out run ${green(
                              "webiny disable-tracking"
                    )}.`
          );
          console.log(
                    `To learn more, check out https://www.webiny.com/telemetry/.`
          );
          console.log();
};

yargs.usage("Usage: $0 <command>")
          .demandCommand(1)
          .strict()
          .recommendCommands()
          .example("$0 deploy-api --env=dev --debug")
          .example("$0 remove-api --env=dev --debug")
          .epilogue(
                    `To find more information, docs and tutorials, see ${blue(
                              "https://docs.webiny.com"
                    )}.`
          )
          .epilogue(
                    `Want to contribute? ${blue(
                              "https://github.com/webiny/webiny-js"
                    )}.`
          )
          .fail(function(msg, err) {
                    if (msg) console.log(msg);
                    if (err) console.log(err);
                    process.exit(1);
          });

yargs.command(
          "create <name>",
          "Create a new Webiny project.",
          yargs => {
                    yargs.positional("name", {
                              describe: "Project name"
                    });
                    yargs.option("tag", {
                              describe: `Dist tag of Webiny to use. Default: ${blue(
                                        "latest"
                              )} `,
                              default: "latest"
                    });
          },
          argv => {
                    trackingNotice();
                    require("./create")(argv);
          }
);

yargs.command(
          "deploy-api",
          `Deploy API from ${green("api")} folder.\n${dim(
                    "(NOTE: run from project root)"
          )}`,
          yargs => {
                    yargs.option("env", {
                              describe:
                                        "Environment to deploy. Must match your environments in .env.json.",
                              default: "local"
                    });
                    yargs.option("alias", {
                              describe: "Alias to deploy."
                    });
                    yargs.option("force", {
                              describe:
                                        "Deploy even if component inputs were not changed."
                    });
                    yargs.option("debug", {
                              describe: "Show debug messages.",
                              default: false,
                              type: "boolean"
                    });
          },
          async argv => {
                    await require("./sls/deploy")({ ...argv, what: "api" });
                    process.exit(0);
          }
);

yargs.command(
          "deploy-apps",
          `Deploy Apps from ${green("apps")} folder.\n${dim(
                    "(NOTE: run from project root)"
          )}`,
          yargs => {
                    yargs.option("env", {
                              describe: `Environment to deploy. Must match an environment in .env.json. \nNOTE: "local" environment is reserved for local development.`
                    });
                    yargs.option("debug", {
                              describe: "Show debug messages.",
                              default: false,
                              type: "boolean"
                    });
          },
          async argv => {
                    await require("./sls/deploy")({ ...argv, what: "apps" });
                    process.exit(0);
          }
);

yargs.command(
          "remove-api",
          `Remove API.\n${dim("(NOTE: run from project root)")}`,
          yargs => {
                    yargs.option("env", {
                              describe: "Environment to remove.",
                              default: "local"
                    });
                    yargs.option("debug", {
                              describe: "Show debug messages.",
                              default: false,
                              type: "boolean"
                    });
          },
          async argv => {
                    await require("./sls/remove")({ ...argv, what: "api" });
                    process.exit(0);
          }
);

yargs.command(
          "remove-apps",
          `Remove Apps.\n${dim("(NOTE: run from project root)")}`,
          yargs => {
                    yargs.option("env", {
                              describe: `Environment to remove. Must match an environment in .env.json.`,
                              default: "dev"
                    });
                    yargs.option("debug", {
                              describe: "Show debug messages.",
                              default: false,
                              type: "boolean"
                    });
          },
          async argv => {
                    await require("./sls/remove")({ ...argv, what: "apps" });
                    process.exit(0);
          }
);

yargs.command(
          "enable-tracking",
          "Enable tracking of Webiny stats.",
          () => {}, // eslint-disable-line
          async () => {
                    await require("./sls/enableTracking")();
          }
);

yargs.command(
          "disable-tracking",
          "Disable tracking of Webiny stats.",
          () => {}, // eslint-disable-line
          async () => {
                    await require("./sls/disableTracking")();
          }
);

yargs.command(
          "scaffold>",
          "Scaffold your application with one of the available templates.",
          () => {}, // eslint-disable-line
          async argv => {
                    const pluginToChoice = plugin => ({
                              name: `${plugin.scaffold.name} - ${plugin.scaffold.description}`,
                              value: plugin.name
                    });

                    const scaffoldModulesNames = JSON.parse(
                              (
                                        await execa(
                                                  'yarn list --pattern="@webiny/cli-scaffold-*|webiny-cli-scaffold-*" --depth=0 --json'
                                        )
                              ).stdout
                    ).data.trees.map(treeNode =>
                              treeNode.name
                                        .split("@")
                                        .slice(0, -1) // Remove the trailing version tag
                                        .join("@")
                    );
                    const scaffoldPlugins = new PluginsContainer();
                    scaffoldModulesNames.forEach(crtModuleName =>
                              scaffoldPlugins.register(require(crtModuleName))
                    );
                    const choices = Object.values(
                              scaffoldPlugins.plugins
                    ).map(plugin => pluginToChoice(plugin));
                    if (choices.length === 0)
                              throw new Error(
                                        "Oddly, there are no available scaffold templates. This must be a coding oversight..."
                              );
                    const { selectedPluginName } = await inquirer.prompt({
                              type: "list",
                              name: "selectedPluginName",
                              message: "Pick the template you'd like to employ",
                              choices
                    });

                    const selectedPlugin = scaffoldPlugins.byName(
                              selectedPluginName
                    );
                    selectedPlugin.scaffold.generate();
          }
);

// Run
yargs.argv;

// Checks for updates
if (!process.env.CI) {
          const updateNotifier = require("update-notifier");
          const pkg = require("./package.json");
          updateNotifier({ pkg }).notify();
}
