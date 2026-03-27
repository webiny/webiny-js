/**
 * Agent adapter: Claude Code
 *
 * MCP config : .mcp.json  (project-level, checked into git)
 * Hint file  : CLAUDE.md  (Claude Code reads this automatically each session)
 *
 * Docs: https://docs.anthropic.com/en/docs/claude-code/mcp
 */

import { join } from "path";
import type { IUi } from "../ui.js";
import { writeMcpConfig, writeHintFile, webinyHintBlock, printDone } from "./shared.js";

interface InitParams {
    ui: IUi;
    cwd: string;
}

export async function init({ ui, cwd }: InitParams): Promise<void> {
    ui.info("Setting up for Claude Code...");

    writeMcpConfig({
        ui,
        configPath: join(cwd, ".mcp.json")
    });

    writeHintFile({
        ui,
        hintPath: join(cwd, "CLAUDE.md"),
        content: webinyHintBlock({ heading: "## Webiny" })
    });

    printDone({ ui });
}
