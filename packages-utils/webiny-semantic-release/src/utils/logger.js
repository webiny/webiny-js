import chalk from "chalk";

/**
 * Logger with `log` and `error` function.
 */
export default () => {
    const prefix = "[WSR]:";

    return {
        log(...args) {
            const [format, ...rest] = args;
            console.log(
                `${chalk.grey(prefix)} ${format.replace(/%[^%]/g, seq => chalk.magenta(seq))}`,
                ...rest
            );
        },
        error(...args) {
            const [format, ...rest] = args;
            console.error(`${chalk.grey(prefix)} ${chalk.red(format)}`, ...rest);
        }
    };
};
