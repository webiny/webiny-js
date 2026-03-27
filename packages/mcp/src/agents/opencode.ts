/**
 * Agent adapter: OpenCode
 *
 * MCP config : opencode.json  (project root)
 * Hint file  : AGENTS.md      (OpenCode reads this automatically each session)
 *
 * OpenCode uses a different MCP config shape than other agents:
 * {
 *   "mcp": {
 *     "webiny": { "type": "local", "command": ["npx", "webiny", "mcp-server"], "enabled": true }
 *   }
 * }
 *
 * Docs: https://opencode.ai/docs/mcp-servers/
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import type { IUi } from "../ui.js";
import { writeHintFile, webinyHintBlock, printDone } from "./shared.js";

interface InitParams {
    ui: IUi;
    cwd: string;
}

export async function init({ ui, cwd }: InitParams): Promise<void> {
    ui.info("Setting up for OpenCode...");

    writeOpenCodeMcpConfig({ ui, configPath: join(cwd, "opencode.json") });

    writeHintFile({
        ui,
        hintPath: join(cwd, "AGENTS.md"),
        content: webinyHintBlock({ heading: "## Webiny" })
    });

    printDone({ ui });
}

// ---------------------------------------------------------------------------
// OpenCode-specific MCP config writer
// ---------------------------------------------------------------------------

interface WriteOpenCodeMcpConfigParams {
    ui: IUi;
    configPath: string;
}

function writeOpenCodeMcpConfig({ ui, configPath }: WriteOpenCodeMcpConfigParams): boolean {
    const entry = {
        type: "local",
        command: ["npx", "webiny-mcp", "serve", "--additional-skills=./my-skills"],
        enabled: true
    };

    let config: { $schema?: string; mcp: Record<string, unknown> } = {
        $schema: "https://opencode.ai/config.json",
        mcp: {}
    };

    if (existsSync(configPath)) {
        try {
            config = JSON.parse(readFileSync(configPath, "utf8"));
            config.mcp ??= {};
        } catch {
            ui.warning(`Could not parse %s — will overwrite.`, configPath);
        }
    }

    if (config.mcp.webiny) {
        ui.info(`%s already has a %s entry — skipping.`, configPath, "webiny");
        return false;
    }

    config.mcp.webiny = entry;
    writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
    ui.success(`Registered Webiny MCP server in %s`, configPath);
    return true;
}
