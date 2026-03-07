/**
 * Shared helpers for agent adapters.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname } from "path";

// ---------------------------------------------------------------------------
// MCP config helpers
// ---------------------------------------------------------------------------

interface WriteMcpConfigParams {
    configPath: string;
}

/**
 * Write (or patch) an MCP server registration into a JSON config file.
 *
 * All agents use the same JSON shape — only the file path differs:
 * {
 *   "mcpServers": {
 *     "webiny": { "command": "npx", "args": ["webiny", "mcp-server"] }
 *   }
 * }
 */
export function writeMcpConfig({ configPath }: WriteMcpConfigParams): boolean {
    ensureDir(configPath);

    const entry = { command: "npx", args: ["webiny", "mcp-server"] };
    let config: { mcpServers: Record<string, unknown> } = { mcpServers: {} };

    if (existsSync(configPath)) {
        try {
            config = JSON.parse(readFileSync(configPath, "utf8"));
            config.mcpServers ??= {};
        } catch {
            console.warn(`[webiny] Warning: could not parse ${configPath} — will overwrite.`);
        }
    }

    if (config.mcpServers.webiny) {
        console.log(`[webiny] ${configPath} already has a 'webiny' entry — skipping.`);
        return false;
    }

    config.mcpServers.webiny = entry;
    writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
    console.log(`[webiny] ✓ Registered Webiny MCP server in ${configPath}`);
    return true;
}

// ---------------------------------------------------------------------------
// Hint file helpers
// ---------------------------------------------------------------------------

interface WriteHintFileParams {
    hintPath: string;
    content: string;
    marker?: string;
}

/**
 * Append Webiny instructions to a markdown hint file (CLAUDE.md,
 * copilot-instructions.md, etc.) if not already present.
 */
export function writeHintFile({
    hintPath,
    content,
    marker = "list_webiny_skills"
}: WriteHintFileParams): boolean {
    ensureDir(hintPath);

    if (existsSync(hintPath)) {
        const existing = readFileSync(hintPath, "utf8");
        if (existing.includes(marker)) {
            console.log(`[webiny] ${hintPath} already contains Webiny instructions — skipping.`);
            return false;
        }
        writeFileSync(hintPath, existing.trimEnd() + "\n\n" + content.trim() + "\n");
    } else {
        writeFileSync(hintPath, content.trim() + "\n");
    }

    console.log(`[webiny] ✓ Wrote Webiny instructions to ${hintPath}`);
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
    extra?: string;
}

export function printDone({ extra = "" }: PrintDoneParams = {}): void {
    console.log("");
    if (extra) {
        console.log(extra);
    }
    console.log("Restart your agent/editor session if it is already running.");
    console.log("");
    console.log("To test the MCP server directly:");
    console.log("  npx @modelcontextprotocol/inspector npx webiny mcp-server");
    console.log("");
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
