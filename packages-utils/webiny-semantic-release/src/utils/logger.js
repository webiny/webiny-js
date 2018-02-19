import chalk from "chalk";

/**
 * Logger with `log` and `error` function.
 */
export default (config = {}) => {
    const prefix = config.prefix || "[WSR]:";

    return {
        log(...args) {
            const [format, ...rest] = args;
            console.log(
                `${chalk.grey(prefix)}${
                    typeof format === "string"
                        ? ` ${format.replace(/%[^%]/g, seq => chalk.magenta(seq))}`
                        : ""
                }`,
                ...(typeof format === "string" ? [] : [format]).concat(rest)
            );
        },
        error(...args) {
            const [format, ...rest] = args;
            console.error(
                `${chalk.grey(prefix)}${typeof format === "string" ? ` ${chalk.red(format)}` : ""}`,
                ...(typeof format === "string" ? [] : [format]).concat(rest)
            );
        }
    };
};
