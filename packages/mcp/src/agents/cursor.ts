/**
 * Agent adapter: Cursor
 *
 * MCP config : .cursor/mcp.json  (project-level)
 * Hint file  : .cursor/rules/webiny.mdc
 *
 * Docs: https://docs.cursor.com/context/model-context-protocol
 */

import { join } from "path";
import type { Ui } from "@webiny/cli-core/exports/cli.js";
import { writeMcpConfig, writeHintFile, webinyHintBlock, printDone } from "./shared.js";

interface InitParams {
    ui: Ui.Interface;
    cwd: string;
}

export async function init({ ui, cwd }: InitParams): Promise<void> {
    ui.info("Setting up for Cursor...");

    writeMcpConfig({
        ui,
        configPath: join(cwd, ".cursor", "mcp.json")
    });

    writeHintFile({
        ui,
        hintPath: join(cwd, ".cursor", "rules", "webiny.mdc"),
        content: webinyHintBlock({ heading: "# Webiny" })
    });

    printDone({ ui });
}
