import chalk from "chalk";
import { type UiService } from "@webiny/cli-core/abstractions/index.js";

const MARK = chalk.magentaBright("◆");
const TICK = chalk.green("✓");

export interface IBannerRow {
    label: string;
    value: string;
}

/** `   - Label:   value`, with the labels in a column. Dimmed, so the values read first. */
const rows = (ui: UiService.Interface, entries: IBannerRow[]) => {
    const width = Math.max(...entries.map(entry => entry.label.length)) + 1;

    for (const { label, value } of entries) {
        ui.text(chalk.dim(`   - ${`${label}:`.padEnd(width)}   `) + value);
    }
};

/**
 * The header a developer sees the moment `webiny watch` starts, before anything is built. It answers
 * the two questions worth answering there: what am I running, and where will it be.
 */
export const printWatchBanner = (
    ui: UiService.Interface,
    params: { version: string; entries: IBannerRow[] }
) => {
    ui.text("");
    ui.text(`   ${MARK} ${chalk.bold(`Webiny ${params.version}`)}`);
    rows(ui, params.entries);
    ui.text("");
};

/** `✓ Starting...`, the counterpart to the ready line printed once the apps report in. */
export const printWatchStarting = (ui: UiService.Interface, note?: string) => {
    ui.text(` ${TICK} Starting...${note ? chalk.dim(` ${note}`) : ""}`);
};

/** `✓ Ready in 4.2s`, followed by where each app ended up. */
export const printWatchReady = (
    ui: UiService.Interface,
    params: { elapsedMs: number; entries: IBannerRow[] }
) => {
    const elapsed =
        params.elapsedMs < 1000
            ? `${params.elapsedMs}ms`
            : `${(params.elapsedMs / 1000).toFixed(1)}s`;

    ui.text(` ${TICK} Ready in ${elapsed}`);
    rows(ui, params.entries);
    ui.text("");
};
