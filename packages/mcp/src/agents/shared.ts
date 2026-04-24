/**
 * Shared helpers for agent adapters.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname } from "path";
import type { IUi } from "../ui.js";

// ---------------------------------------------------------------------------
// MCP config helpers
// ---------------------------------------------------------------------------

interface WriteMcpConfigParams {
    ui: IUi;
    configPath: string;
}

/**
 * Write (or patch) an MCP server registration into a JSON config file.
 *
 * All agents use the same JSON shape — only the file path differs:
 * {
 *   "mcpServers": {
 *     "webiny": { "command": "npx", "args": ["webiny-mcp", "serve"] }
 *   }
 * }
 */
export function writeMcpConfig({ ui, configPath }: WriteMcpConfigParams): boolean {
    ensureDir(configPath);

    const entry = {
        command: "npx",
        args: ["webiny-mcp", "serve", "--additional-skills=./my-skills"]
    };
    let config: { mcpServers: Record<string, unknown> } = { mcpServers: {} };

    if (existsSync(configPath)) {
        try {
            config = JSON.parse(readFileSync(configPath, "utf8"));
            config.mcpServers ??= {};
        } catch {
            ui.warning(`Could not parse %s — will overwrite.`, configPath);
        }
    }

    if (config.mcpServers.webiny) {
        ui.info(`%s already has a %s entry — skipping.`, configPath, "webiny");
        return false;
    }

    config.mcpServers.webiny = entry;
    writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
    ui.success(`Registered Webiny MCP server in %s`, configPath);
    return true;
}

// ---------------------------------------------------------------------------
// Hint file helpers
// ---------------------------------------------------------------------------

interface WriteHintFileParams {
    ui: IUi;
    hintPath: string;
    content: string;
    marker?: string;
}

/**
 * Append Webiny instructions to a markdown hint file (CLAUDE.md,
 * copilot-instructions.md, etc.) if not already present.
 */
export function writeHintFile({
    ui,
    hintPath,
    content,
    marker = "list_webiny_skills"
}: WriteHintFileParams): boolean {
    ensureDir(hintPath);

    if (existsSync(hintPath)) {
        const existing = readFileSync(hintPath, "utf8");
        if (existing.includes(marker)) {
            ui.info(`%s already contains Webiny instructions — skipping.`, hintPath);
            return false;
        }
        writeFileSync(hintPath, existing.trimEnd() + "\n\n" + content.trim() + "\n");
    } else {
        writeFileSync(hintPath, content.trim() + "\n");
    }

    ui.success(`Wrote Webiny instructions to ${hintPath}`);
    return true;
}

// ---------------------------------------------------------------------------
// Common hint block (same concept across all agents, slightly different wrapping)
// ---------------------------------------------------------------------------

interface WebinyHintBlockParams {
    heading?: string;
    prefix?: string;
}

export function webinyHintBlock({
    heading = "## Webiny",
    prefix = ""
}: WebinyHintBlockParams = {}): string {
    return [
        heading,
        "",
        `${prefix}This project uses the Webiny framework.`,
        `${prefix}A \`webiny\` MCP server is available.`,
        `${prefix}When helping with Webiny-related tasks:`,
        `${prefix}1. Call \`list_webiny_skills\` to see available skills.`,
        `${prefix}2. Call \`get_webiny_skill\` with the relevant topic before writing code.`,
        ""
    ].join("\n");
}

// ---------------------------------------------------------------------------
// Done message
// ---------------------------------------------------------------------------

interface PrintDoneParams {
    ui: IUi;
    extra?: string;
}

export function printDone({ ui, extra }: PrintDoneParams): void {
    ui.emptyLine();
    if (extra) {
        ui.warning(extra);
    }
    ui.info("Restart your agent/editor session if it is already running.");
    ui.emptyLine();
    ui.info("To test the MCP server directly:");
    ui.info("  %s", "npx @modelcontextprotocol/inspector npx webiny-mcp serve");
    ui.emptyLine();
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

function ensureDir(filePath: string): void {
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
}
