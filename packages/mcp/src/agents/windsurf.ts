/**
 * Agent adapter: Windsurf (Codeium)
 *
 * MCP config : .windsurf/mcp.json  (project-level)
 * Hint file  : .windsurf/rules/webiny.md
 *
 * Docs: https://docs.codeium.com/windsurf/mcp
 */

import { join } from "path";
import type { IUi } from "../ui.js";
import { writeMcpConfig, writeHintFile, webinyHintBlock, printDone } from "./shared.js";

interface InitParams {
    ui: IUi;
    cwd: string;
}

export async function init({ ui, cwd }: InitParams): Promise<void> {
    ui.info("Setting up for Windsurf...");

    writeMcpConfig({
        ui,
        configPath: join(cwd, ".windsurf", "mcp.json")
    });

    writeHintFile({
        ui,
        hintPath: join(cwd, ".windsurf", "rules", "webiny.md"),
        content: webinyHintBlock({ heading: "## Webiny" })
    });

    printDone({ ui });
}
