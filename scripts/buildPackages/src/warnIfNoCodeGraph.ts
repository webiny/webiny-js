import fs from "fs";
import path from "path";
import chalk from "chalk";

const { yellow, green } = chalk;

/**
 * CodeGraph indexes the repo so that coding agents can look up symbols, callers and call
 * paths instead of grepping their way through it. A build doesn't need it, but working
 * without it is slower and less accurate, so point it out when the index isn't there.
 *
 * Written to stderr, because in `--json` mode stdout carries the event stream.
 */
export const warnIfNoCodeGraph = () => {
    // Nobody is running agents on the CI machine, so the warning is just noise there.
    if (process.env.CI) {
        return;
    }

    if (fs.existsSync(path.join(process.cwd(), ".codegraph"))) {
        return;
    }

    console.warn(
        yellow("⚠ No .codegraph folder found.") +
            ` Coding agents use CodeGraph to find their way around this repo. Run ${green(
                "npx codegraph init"
            )} to index it.\n`
    );
};
