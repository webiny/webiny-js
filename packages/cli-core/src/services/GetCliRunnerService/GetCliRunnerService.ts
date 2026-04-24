import { createImplementation } from "@webiny/di";
import {
    CliCommandFactory,
    CommandsRegistryService,
    GetArgvService,
    GetCliRunnerService,
    GlobalOptionsRegistryService,
    GetProjectSdkService,
    UiService
} from "~/abstractions/index.js";
import yargs from "yargs/yargs";
import chalk from "chalk";
import { Argv } from "yargs";
import { GracefulError } from "@webiny/project";
import { ManuallyReportedError } from "~/utils/ManuallyReportedError.js";

const { blue, bgYellow, bold } = chalk;

export class DefaultGetCliRunnerService implements GetCliRunnerService.Interface {
    constructor(
        private readonly commandsRegistryService: CommandsRegistryService.Interface,
        private readonly globalOptionsRegistryService: GlobalOptionsRegistryService.Interface,
        private readonly uiService: UiService.Interface,
        private readonly getProjectSdkService: GetProjectSdkService.Interface,
        private readonly getArgvService: GetArgvService.Interface
    ) {}

    private yargsRunner: Argv | null = null;

    async execute() {
        if (this.yargsRunner) {
            return this.yargsRunner;
        }

        const ui = this.uiService;
        const projectSdk = await this.getProjectSdkService.execute();

        const yargsRunner = yargs()
            .usage("Usage: $0 <command> [options]")
            .help(false)
            .demandCommand(1)
            .recommendCommands()
            .scriptName("webiny")
            .epilogue(
                `To find more information, docs and tutorials, see ${blue(
                    "https://www.webiny.com/docs"
                )}.`
            )
            .epilogue(`Want to contribute? ${blue("https://github.com/webiny/webiny-js")}.`);

        // Register global options.
        const globalOptions = this.globalOptionsRegistryService.execute();
        for (const globalOption of globalOptions) {
            const { name, config } = await globalOption.execute();
            yargsRunner.option(name, {
                type: config.type,
                default: config.default,
                desc: config.description,
                alias: config.alias,
                choices: config.choices,
                global: true
            });
        }

        yargsRunner.fail((invalidParamsMessage, error) => {
            if (invalidParamsMessage) {
                if (invalidParamsMessage.includes("Not enough non-option arguments")) {
                    ui.emptyLine();
                    ui.error("Command was not invoked as expected.");
                    ui.info(
                        `Some non-optional arguments are missing. See the usage examples printed below.`
                    );
                    ui.emptyLine();
                    yargsRunner.showHelp();
                    process.exit(1);
                }

                if (invalidParamsMessage.includes("Missing required argument")) {
                    const args = invalidParamsMessage
                        .split(":")[1]
                        .split(",")
                        .map(v => v.trim());

                    ui.emptyLine();
                    ui.error("Command was not invoked as expected.");
                    ui.info(
                        `Missing required argument(s): ${args.join(
                            ", "
                        )}. See the usage examples printed below.`
                    );
                    ui.emptyLine();
                    yargsRunner.showHelp();
                    process.exit(1);
                }

                ui.emptyLine();
                ui.error(invalidParamsMessage);

                process.exit(1);
            }

            const logger = projectSdk.getLogger();
            logger.error({ err: error }, "CLI command execution failed.");

            const realError = (error.cause as Error) || error;

            if (realError instanceof ManuallyReportedError) {
                // Do nothing as the error reporting has already been
                // handled within the invoked CLI command.
            } else {
                ui.error(realError.message);
            }

            const argv = this.getArgvService.execute();
            if (argv.showStackTrace && realError.stack) {
                ui.emptyLine();
                ui.debug("Stack trace:");
                ui.text(realError.stack);
            }

            if (error instanceof GracefulError) {
                ui.emptyLine();
                ui.text(bgYellow(bold("💡 How can I resolve this?")));
                ui.text(error.message);
            }

            process.exit(1);
        });

        const commands = this.commandsRegistryService.execute();

        for (const command of commands) {
            const {
                name,
                description,
                params = [],
                options = [],
                handler
            } = await command.execute();

            let yargsCommand = name;
            const paramVersionExists = params.some(p => {
                return p.name === "version";
            });
            if (paramVersionExists) {
                ui.error(
                    `The command "${name}" cannot have a parameter named "version" as it conflicts with the global --version option.`
                );
                process.exit();
            }

            if (params.length > 0) {
                yargsCommand +=
                    " " +
                    params
                        .map(param => {
                            const paramName = param.array ? `${param.name}..` : param.name;
                            return param.required ? `<${paramName}>` : `[${paramName}]`;
                        })
                        .join(" ");
            }

            yargsRunner.command(
                yargsCommand,
                description,
                yargs => {
                    params.forEach((param: CliCommandFactory.ParamDefinition<unknown>) => {
                        const { name, required, validation, array, ...rest } = param;

                        const yargsParam = yargs.positional(name, {
                            ...rest,
                            ...(array && { array: true }),
                            demandOption: required
                        });

                        if (validation) {
                            yargsParam.check(validation);
                        }
                    });

                    options.forEach((option: CliCommandFactory.OptionDefinition<unknown>) => {
                        const { name, required, validation, ...rest } = option;

                        const yargsOption = yargs.option(name, {
                            ...rest,
                            demandOption: required
                        });

                        if (option.group) {
                            yargsOption.group(option.name, option.group);
                        }

                        if (validation) {
                            yargsOption.check(validation);
                        }
                    });
                },
                handler
            );
        }

        yargsRunner.help(true);
        yargsRunner.version(projectSdk.getProjectVersion());
        this.yargsRunner = yargsRunner;
        return this.yargsRunner;
    }
}

export const getCliRunnerService = createImplementation({
    abstraction: GetCliRunnerService,
    implementation: DefaultGetCliRunnerService,
    dependencies: [
        CommandsRegistryService,
        GlobalOptionsRegistryService,
        UiService,
        GetProjectSdkService,
        GetArgvService
    ]
});
