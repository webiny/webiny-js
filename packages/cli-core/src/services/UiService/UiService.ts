import { createImplementation } from "@webiny/di-container";
import chalk from "chalk";
import util from "util";
import { UiService, StdioService } from "~/abstractions/index.js";

const NEW_LINE = "\n";

const LOG_COLORS = {
    info: chalk.blueBright,
    error: chalk.red,
    warning: chalk.yellow,
    success: chalk.green,
    debug: chalk.gray
} as const;

export class DefaultUiService implements UiService.Interface {
    constructor(private readonly stdio: StdioService.Interface) {
        this.stdio = stdio;
    }

    raw(text: string) {
        this.stdio.getStdout().write(text);
    }

    text(text: string) {
        this.stdio.getStdout().write(text);
        this.newLine();
    }

    textBold(text: string) {
        this.text(chalk.bold(text));
    }

    newLine() {
        this.stdio.getStdout().write(NEW_LINE);
    }

    // The following methods are used to print texts with a specific type prefix.
    success(text: string, ...args: any[]) {
        this.typedColorizedText("success", text, ...args);
    }

    info(text: string, ...args: any[]) {
        this.typedColorizedText("info", text, ...args);
    }

    warning(text: string, ...args: any[]) {
        this.typedColorizedText("warning", text, ...args);
    }

    error(text: string, ...args: any[]) {
        this.typedColorizedText("error", text, ...args);
    }

    debug(text: string, ...args: any[]) {
        this.typedColorizedText("debug", text, ...args);
    }

    private typedColorizedText(type: keyof typeof LOG_COLORS, text: string, ...args: any[]) {
        let prefix = `${LOG_COLORS[type](type)}: `;
        if (process.env.WEBINY_CLI_SLIM_PREFIX) {
            prefix = `${LOG_COLORS[type]("│")} `;
        }

        // Replace all placeholders (match with `/%[a-zA-Z]/g` regex) with colorized values.
        const textWithColorizedPlaceholders = text.replace(/%[a-zA-Z]/g, match => {
            return LOG_COLORS[type](match);
        });

        return this.text(prefix + util.format(textWithColorizedPlaceholders, ...args));
    }
}

export const uiService = createImplementation({
    abstraction: UiService,
    implementation: DefaultUiService,
    dependencies: [StdioService]
});
