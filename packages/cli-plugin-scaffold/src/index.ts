import { CliCommandPlugin } from "./types";
import { scaffold } from "./scaffold";

export default (): CliCommandPlugin => ({
    type: "cli-command",
    name: "cli-command-scaffold",
    create({ yargs, context }) {
        yargs.command(
            "scaffold [template-name]",
            "Generate boilerplate code",
            (yargs: Record<string, any>) => {
                yargs.example("$0 scaffold");
                yargs.example("$0 scaffold new-extension --type admin --name customFilePreview");
                yargs.positional("templateName", {
                    describe: `Name of the scaffold to run (useful when running in non-interactive mode).`,
                    type: "string"
                });
            },
            (argv: Record<string, any>) => {
                return scaffold(context, argv);
            }
        );
    }
});
