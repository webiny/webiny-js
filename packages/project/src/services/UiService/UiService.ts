import { createImplementation } from "@webiny/di";
import chalk from "chalk";
import util from "util";
import wrapAnsi from "wrap-ansi";
import { UiService, StdioService, IsCi } from "~/abstractions/index.js";

const NEW_LINE = "\n";
const PIPE_SYMBOL = "┃";

// Visible width of the `┃ ` gutter that prefixes every line of a typed message. Hardcoded rather
// than measured because the pipe is a single-column glyph and the colour codes around it occupy no
// columns at all.
const GUTTER_WIDTH = 2;

// A floor for very narrow terminals, so the wrap width can never go to zero or negative.
const MIN_TEXT_WIDTH = 20;

const LOG_COLORS = {
    info: chalk.blueBright,
    error: chalk.red,
    warning: chalk.yellow,
    success: chalk.green,
    debug: chalk.gray
} as const;

export class DefaultUiService implements UiService.Interface {
    constructor(
        private readonly stdio: StdioService.Interface,
        private readonly isCi: IsCi.Interface
    ) {}

    raw(text: string) {
        this.stdio.getStdout().write(text);
    }

    text(text: string) {
        this.stdio.getStdout().write(text);
        this.stdio.getStdout().write(NEW_LINE);
    }

    textBold(text: string) {
        this.text(chalk.bold(text));
    }

    emptyLine() {
        this.stdio.getStdout().write(chalk.gray("∙") + NEW_LINE);
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
        // Use plain text format in CI environments.
        if (this.isCi.execute()) {
            const prefix = `${type}: `;
            return this.text(prefix + util.format(text, ...args));
        }

        const gutter = `${LOG_COLORS[type](PIPE_SYMBOL)} `;

        // Replace all placeholders (match with `/%[a-zA-Z]/g` regex) with colorized values.
        const textWithColorizedPlaceholders = text.replace(/%[a-zA-Z]/g, match => {
            return LOG_COLORS[type](match);
        });

        const message = util.format(textWithColorizedPlaceholders, ...args);

        return this.text(this.applyGutter(message, gutter));
    }

    /**
     * Prefixes every line of `message` with the gutter, wrapping the text to the terminal width
     * first.
     *
     * The wrap has to happen here rather than being left to the terminal. Writing the whole message
     * as one long line means the terminal wraps it at column 0, with no knowledge of the gutter -
     * so continuation lines start underneath the pipe instead of underneath the text, and a wrapped
     * sentence reads as though it belongs to a different paragraph.
     */
    private applyGutter(message: string, gutter: string) {
        const textWidth = this.getTextWidth();

        // `hard` also breaks words longer than a whole line - a long file path, or a URL. Letting
        // those overflow would hand them straight back to the terminal's own wrapping, which is
        // the column-0 behaviour this method exists to avoid.
        const wrapped = textWidth ? wrapAnsi(message, textWidth, { hard: true }) : message;

        return wrapped
            .split(NEW_LINE)
            .map(line => gutter + line)
            .join(NEW_LINE);
    }

    /**
     * Width available for the text itself, or `null` when there is nothing to wrap to.
     *
     * `columns` is undefined whenever stdout is not a TTY - piped to a file, or read by another
     * process. Wrapping to a guessed width there would bake line breaks into output that something
     * else is going to reflow anyway, so the message is left as a single line.
     */
    private getTextWidth() {
        const columns = this.stdio.getStdout().columns;
        if (!columns) {
            return null;
        }

        return Math.max(columns - GUTTER_WIDTH, MIN_TEXT_WIDTH);
    }
}

export const uiService = createImplementation({
    abstraction: UiService,
    implementation: DefaultUiService,
    dependencies: [StdioService, IsCi]
});
