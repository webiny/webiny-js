/**
 * Agent adapter: GitHub Copilot / VS Code
 *
 * MCP config : .vscode/mcp.json  (project-level)
 * Hint file  : .github/copilot-instructions.md
 *
 * Note: VS Code uses "servers" as the top-level key, not "mcpServers".
 *
 * Docs: https://code.visualstudio.com/docs/copilot/chat/mcp-servers
 */

import { join, dirname } from "path";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import type { IUi } from "../ui.js";
import { writeHintFile, webinyHintBlock, printDone } from "./shared.js";

interface InitParams {
    ui: IUi;
    cwd: string;
}

function writeCopilotMcpConfig(ui: IUi, configPath: string): boolean {
    const dir = dirname(configPath);
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }

    const entry = { command: "npx", args: ["webiny-mcp", "serve"] };
    let config: { servers: Record<string, unknown> } = { servers: {} };

    if (existsSync(configPath)) {
        try {
            config = JSON.parse(readFileSync(configPath, "utf8"));
            config.servers ??= {};
        } catch {
            ui.warning(`Could not parse %s — will overwrite.`, configPath);
        }
    }

    if (config.servers.webiny) {
        ui.info(`${configPath} already has a %s entry — skipping.`, "webiny");
        return false;
    }

    config.servers.webiny = entry;
    writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
    ui.success(`Registered Webiny MCP server in %s`, configPath);
    return true;
}

export async function init({ ui, cwd }: InitParams): Promise<void> {
    ui.info("Setting up for GitHub Copilot (VS Code)...");

    writeCopilotMcpConfig(ui, join(cwd, ".vscode", "mcp.json"));

    writeHintFile({
        ui,
        hintPath: join(cwd, ".github", "copilot-instructions.md"),
        content: webinyHintBlock({ heading: "## Webiny" })
    });

    printDone({ ui });
}
