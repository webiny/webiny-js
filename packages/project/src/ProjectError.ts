import chalk from "chalk";
import util from "util";

export class ProjectError extends Error {
    static from(...message: string[]): ProjectError {
        const formattedMessage = this.formatMessage(...message);
        return new ProjectError(formattedMessage);
    }

    static formatMessage(...message: string[]): string {
        const [text, ...args] = message;
        // Replace all placeholders (match with `/%[a-zA-Z]/g` regex) with colorized values.
        const messageWithColorizedPlaceholders = text.replace(/%[a-zA-Z]/g, match => {
            return chalk.red(match);
        });

        return util.format(messageWithColorizedPlaceholders, ...args);
    }
}
