/**
 * --instructions / --manual
 *
 * Prints a clear, copy-paste-friendly guide for wiring up the Webiny MCP
 * server in any agent not covered by the built-in adapters.
 *
 * The agent tables are auto-generated from preset metadata.
 */

import { discoverPresets } from "./discover.js";

export async function printInstructions(): Promise<void> {
    const presets = await discoverPresets();

    const configRows = presets.map(p => {
        const note = p.configNote ? `  (${p.configNote})` : "";
        return formatRow(p.displayName, p.configFile + note);
    });

    const hintRows = presets
        .filter(p => p.hintFile)
        .map(p => formatRow(p.displayName, p.hintFile!));
    presets
        .filter(p => !p.hintFile && p.hintNote)
        .forEach(p => hintRows.push(formatRow(p.displayName, p.hintNote!)));

    const lines = [
        "",
        "╔══════════════════════════════════════════════════════════════════╗",
        "║           Webiny MCP Server — Manual Setup Guide                ║",
        "╚══════════════════════════════════════════════════════════════════╝",
        "",
        "The Webiny MCP server works with any agent that supports the Model",
        "Context Protocol (MCP) over stdio transport.",
        "",
        "── Step 1: Register the MCP server ───────────────────────────────",
        "",
        "Most agents accept a JSON config file. Add the following entry:",
        "",
        '  "webiny": {',
        '    "command": "npx",',
        '    "args": ["webiny-mcp", "serve"]',
        "  }",
        "",
        "Where this config lives depends on your agent:",
        "",
        "  Agent              Config file",
        "  ─────────────────  ──────────────────────────────────────",
        ...configRows,
        "",
        "Full example (the most common shape):",
        "",
        "  {",
        '    "mcpServers": {',
        '      "webiny": {',
        '        "command": "npx",',
        '        "args": ["webiny-mcp", "serve"]',
        "      }",
        "    }",
        "  }",
        "",
        "── Step 2: Tell your agent about the MCP tools ───────────────────",
        "",
        "Add the following to your agent's instruction / rules file so it",
        "knows to reach for the Webiny tools automatically:",
        "",
        "  ## Webiny",
        "  This project uses the Webiny framework.",
        "  A `webiny` MCP server is available.",
        "  When helping with Webiny-related tasks:",
        "  1. Call `list_webiny_skills` to see available skills.",
        "  2. Call `get_webiny_skill` with the relevant topic before writing code.",
        "",
        "Where this instruction file lives:",
        "",
        "  Agent              Instruction file",
        "  ─────────────────  ──────────────────────────────────────",
        ...hintRows,
        "",
        "── Step 3: Verify the server starts ──────────────────────────────",
        "",
        "Test it with the MCP Inspector before relying on it in your agent:",
        "",
        "  npx @modelcontextprotocol/inspector npx webiny-mcp server",
        "",
        "Connect, click 'List Tools', and confirm you see:",
        "  • list_webiny_skills",
        "  • get_webiny_skill",
        "",
        "── Need a built-in adapter for your agent? ───────────────────────",
        "",
        "Open an issue or PR at: https://github.com/webiny/webiny-js",
        "The adapter just needs to write the right config file — see",
        "mcp/agents/claude.ts as a reference (~20 lines).",
        ""
    ];

    process.stdout.write(lines.join("\n") + "\n");
}

function formatRow(agent: string, path: string): string {
    return `  ${agent.padEnd(17)}  ${path}`;
}
