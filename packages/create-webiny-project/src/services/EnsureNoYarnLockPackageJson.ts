import { findUp } from "find-up";
import chalk from "chalk";

const { red } = chalk;

export class EnsureNoYarnLockPackageJson {
    async execute() {
        return Promise.all([findUp("yarn.lock"), findUp("package.json")])
            .then(files => files.filter(Boolean))
            .then(files => {
                if (files.length) {
                    const messages = [
                        "\nThe following file(s) will cause problems with project root detection:\n",
                        ...files.map(file => red(file) + "\n"),
                        `\nMake sure you delete all ${red("yarn.lock")} and ${red(
                            "package.json"
                        )} files higher in the hierarchy.`
                    ];

                    console.log(messages.join(""));
                    process.exit(1);
                }
            });
    }
}
