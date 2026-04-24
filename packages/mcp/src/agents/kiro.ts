/**
 * Agent adapter: Kiro
 *
 * MCP config : .kiro/settings/mcp.json  (project-level, checked into git)
 * Hint file  : AGENTS.md  (Claude Code reads this automatically each session)
 *
 * Docs: https://docs.anthropic.com/en/docs/claude-code/mcp
 */

import { join } from "path";
import type { IUi } from "../ui.js";
import type { AgentPreset } from "./types.js";
import { writeMcpConfig, writeHintFile, webinyHintBlock, printDone } from "./shared.js";

export const preset: AgentPreset = {
    slug: "kiro",
    displayName: "Kiro",
    configFile: ".kiro/settings/mcp.json",
    hintFile: "AGENTS.md"
};

interface InitParams {
    ui: IUi;
    cwd: string;
}

export async function init({ ui, cwd }: InitParams): Promise<void> {
    ui.info("Setting up for Kiro...");

    writeMcpConfig({
        ui,
        configPath: join(cwd, ".kiro/settings/mcp.json")
    });

    writeHintFile({
        ui,
        hintPath: join(cwd, "AGENTS.md"),
        content: webinyHintBlock({ heading: "## Webiny" })
    });

    printDone({ ui });
}
