import { describe, test, expect, beforeEach } from "vitest";
import chalk from "chalk";
import stripAnsi from "strip-ansi";
import { DefaultUiService } from "~/services/UiService/UiService.js";
import type { StdioService, IsCi } from "~/abstractions/index.js";

// `chalk` disables colours when it does not detect a colour-capable terminal, and vitest is not
// one. Forcing level 1 on keeps the ANSI codes in the output so the tests actually exercise the
// ANSI-aware wrapping rather than a plain-string fast path.
chalk.level = 1;

const createStdio = (columns: number | undefined) => {
    const written: string[] = [];

    const stdout = {
        columns,
        write: (text: string) => {
            written.push(text);
            return true;
        }
    };

    const stdio: StdioService.Interface = {
        getStdout: () => stdout as any,
        getStderr: () => stdout as any,
        getStdin: () => ({}) as any
    };

    // Joined, then split on newlines: `text()` writes the message and the trailing newline as two
    // separate `write` calls, so joining first keeps them from being counted as separate lines.
    const lines = () => stripAnsi(written.join("")).replace(/\n$/, "").split("\n");

    return { stdio, lines };
};

const notCi: IsCi.Interface = { execute: () => false };
const isCi: IsCi.Interface = { execute: () => true };

describe("UiService line wrapping", () => {
    let stdio: ReturnType<typeof createStdio>;

    beforeEach(() => {
        stdio = createStdio(60);
    });

    test("should prefix every wrapped line with the gutter, so text stays aligned", () => {
        const ui = new DefaultUiService(stdio.stdio, notCi);

        ui.info(
            "Changes done in webiny.config.tsx are not reloaded automatically. " +
                "You'll have to restart the watch command in order for your changes to take effect."
        );

        const lines = stdio.lines();

        expect(lines.length).toBeGreaterThan(1);

        // The point of the change: the continuation lines carry the gutter too, so the text on
        // every line begins at the same column instead of at column 0.
        for (const line of lines) {
            expect(line.startsWith("┃ ")).toBe(true);
        }

        const textColumns = lines.map(line => line.indexOf(line.trim().charAt(0)));
        expect(new Set(textColumns).size).toBe(1);
    });

    test("should wrap to the terminal width less the gutter", () => {
        const ui = new DefaultUiService(stdio.stdio, notCi);

        ui.info("word ".repeat(60).trim());

        for (const line of stdio.lines()) {
            expect(line.length).toBeLessThanOrEqual(60);
        }
    });

    test("should break a word that is longer than the line rather than let it overflow", () => {
        const ui = new DefaultUiService(stdio.stdio, notCi);

        ui.info("/" + "very-long-path-segment/".repeat(10));

        const lines = stdio.lines();

        expect(lines.length).toBeGreaterThan(1);
        for (const line of lines) {
            expect(line.length).toBeLessThanOrEqual(60);
            expect(line.startsWith("┃ ")).toBe(true);
        }
    });

    test("should keep the message on one line when stdout is not a TTY", () => {
        // `columns` is undefined when the output is piped or redirected. Nothing should be wrapped
        // in that case - whatever consumes the output reflows it itself.
        const piped = createStdio(undefined);
        const ui = new DefaultUiService(piped.stdio, notCi);

        const message = "word ".repeat(60).trim();
        ui.info(message);

        const lines = piped.lines();
        expect(lines).toHaveLength(1);
        expect(lines[0]).toBe(`┃ ${message}`);
    });

    test("should gutter each line of a message that already contains newlines", () => {
        const ui = new DefaultUiService(stdio.stdio, notCi);

        ui.info("first line\nsecond line");

        expect(stdio.lines()).toEqual(["┃ first line", "┃ second line"]);
    });

    test("should keep interpolated values intact while wrapping", () => {
        const ui = new DefaultUiService(stdio.stdio, notCi);

        ui.info("Changes done in %s are not reloaded automatically.", "webiny.config.tsx");

        expect(stdio.lines().join(" ")).toContain("webiny.config.tsx");
    });

    test("should not wrap or gutter in CI", () => {
        const ui = new DefaultUiService(stdio.stdio, isCi);

        const message = "word ".repeat(60).trim();
        ui.info(message);

        expect(stdio.lines()).toEqual([`info: ${message}`]);
    });
});
