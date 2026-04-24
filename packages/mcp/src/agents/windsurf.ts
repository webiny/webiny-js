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
import type { AgentPreset } from "./types.js";
import { writeMcpConfig, writeHintFile, webinyHintBlock, printDone } from "./shared.js";

export const preset: AgentPreset = {
    slug: "windsurf",
    displayName: "Windsurf",
    configFile: ".windsurf/mcp.json",
    hintFile: ".windsurf/rules/*.md"
};

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
