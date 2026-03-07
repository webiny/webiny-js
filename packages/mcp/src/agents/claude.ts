/**
 * Agent adapter: Claude Code
 *
 * MCP config : .mcp.json  (project-level, checked into git)
 * Hint file  : CLAUDE.md  (Claude Code reads this automatically each session)
 *
 * Docs: https://docs.anthropic.com/en/docs/claude-code/mcp
 */

import { join } from "path";
import { writeMcpConfig, writeHintFile, webinyHintBlock, printDone } from "./shared.js";

interface InitParams {
    cwd: string;
}

export async function init({ cwd }: InitParams): Promise<void> {
    console.log("[webiny] Setting up for Claude Code...\n");

    writeMcpConfig({
        configPath: join(cwd, ".mcp.json")
    });

    writeHintFile({
        hintPath: join(cwd, "CLAUDE.md"),
        content: webinyHintBlock({ heading: "## Webiny" })
    });

    printDone();
}
