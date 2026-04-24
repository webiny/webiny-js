/**
 * Agent adapter: Cline
 *
 * MCP config : .vscode/cline_mcp_settings.json  (project-level)
 *
 * Cline reads instructions from its system prompt in settings,
 * so we only write the MCP config file.
 *
 * Docs: https://docs.cline.bot/mcp-servers/configuring-mcp-servers
 */

import { join } from "path";
import type { IUi } from "../ui.js";
import type { AgentPreset } from "./types.js";
import { writeMcpConfig, printDone } from "./shared.js";

export const preset: AgentPreset = {
    slug: "cline",
    displayName: "Cline",
    configFile: ".vscode/cline_mcp_settings.json",
    hintNote: "system prompt in settings"
};

interface InitParams {
    ui: IUi;
    cwd: string;
}

export async function init({ ui, cwd }: InitParams): Promise<void> {
    ui.info("Setting up for Cline...");

    writeMcpConfig({
        ui,
        configPath: join(cwd, ".vscode", "cline_mcp_settings.json")
    });

    printDone({
        ui,
        extra: "Add Webiny instructions to Cline's system prompt in settings manually."
    });
}
