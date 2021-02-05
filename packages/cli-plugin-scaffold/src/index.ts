import { CliCommandPlugin } from "./types";
import { scaffold } from "./scaffold";

export default (): CliCommandPlugin => ({
    type: "cli-command",
    name: "cli-command-scaffold",
    create({ yargs, context }) {
        yargs.command("scaffold", "Generate boilerplate code", () => {
            return scaffold({ context });
        });
    }
});
