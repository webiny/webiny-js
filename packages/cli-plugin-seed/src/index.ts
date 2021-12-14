import { CliCommandPlugin, CliCommandSeedRunArgs, CliSeedContext } from "~/types";
import { seed } from "./seed";

export default (): CliCommandPlugin => ({
    type: "cli-command",
    name: "cli-command-seed",
    create({ yargs, context }) {
        yargs.example("$0 seed --env=dev");
        yargs.command(
            "seed",
            "Generate random data records to your deployed Webiny system",
            y => {
                y.option("env", {
                    describe: "Environment to seed to.",
                    type: "string",
                    demandOption: true
                });
                y.option("skip-warning", {
                    describe: "Skip additional charges warning.",
                    default: false,
                    type: "boolean"
                });
            },
            async (args: CliCommandSeedRunArgs) => {
                return seed({
                    context: context as CliSeedContext,
                    args
                });
            }
        );
    }
});
