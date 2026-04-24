import { readFileSync, readdirSync, existsSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import fm from "front-matter";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface IMcpServerParams {
    skills?: string;
    additionalSkills?: string[];
}

// ---------------------------------------------------------------------------
// Skill discovery
// ---------------------------------------------------------------------------

interface SkillAttributes {
    name: string;
    description: string;
    context?: string;
}

interface Skill {
    name: string;
    description: string;
    context: string;
    filePath: string;
}

/**
 * Recursively find all SKILL.md files under `dir`.
 */
function findSkillFiles(dir: string): string[] {
    if (!existsSync(dir)) {
        return [];
    }
    const results: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...findSkillFiles(fullPath));
        } else if (entry.isFile() && entry.name === "SKILL.md") {
            results.push(fullPath);
        }
    }
    return results;
}

/**
 * Discover skills from multiple directories. First match wins (higher-priority dirs first).
 */
function discoverSkills(skillsDirs: string[]): Map<string, Skill> {
    const skills = new Map<string, Skill>();

    for (const dir of skillsDirs) {
        for (const filePath of findSkillFiles(dir)) {
            try {
                const raw = readFileSync(filePath, "utf8");
                const parsed = fm<SkillAttributes>(raw);
                const { name, description } = parsed.attributes;

                if (!name || !description) {
                    console.error(`[webiny-mcp] skipping ${filePath}: missing name or description`);
                    continue;
                }

                if (!skills.has(name)) {
                    const context = parsed.attributes.context || "webiny-extensions";
                    skills.set(name, { name, description, context, filePath });
                }
            } catch (err) {
                console.error(`[webiny-mcp] error reading ${filePath}:`, err);
            }
        }
    }

    return skills;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getVersion(): string {
    try {
        return createRequire(import.meta.url)("../../package.json").version;
    } catch {
        return "0.0.0";
    }
}

function buildCatalog(skills: Map<string, Skill>): string {
    const lines: string[] = [`# Webiny Skills  (v${getVersion()})`, ""];

    if (skills.size === 0) {
        lines.push(
            "_(No skills found. Add SKILL.md files with front-matter to a skills directory.)_"
        );
        return lines.join("\n");
    }

    // Group skills by context.
    const contextDescriptions: Record<string, string> = {
        "webiny-extensions":
            "Use these skills when writing Webiny extensions (usually in `extensions/`) or making changes to `webiny.config.tsx` (user project development).",
        "webiny-packages":
            "Use these skills when writing code in `packages/` (core Webiny framework development)."
    };

    const groups = new Map<string, Skill[]>();
    for (const skill of skills.values()) {
        const list = groups.get(skill.context) || [];
        list.push(skill);
        groups.set(skill.context, list);
    }

    for (const [context, contextSkills] of [...groups.entries()].sort((a, b) =>
        a[0].localeCompare(b[0])
    )) {
        lines.push(`## ${context}`, "");
        const desc = contextDescriptions[context];
        if (desc) {
            lines.push(desc, "");
        }
        lines.push("| Skill | Description |");
        lines.push("|---|---|");
        for (const skill of contextSkills.sort((a, b) => a.name.localeCompare(b.name))) {
            const skillDesc = skill.description.replace(/\n/g, " ").trim();
            lines.push(`| \`${skill.name}\` | ${skillDesc} |`);
        }
        lines.push("");
    }

    return lines.join("\n");
}

function readSkillContent(skill: Skill): string {
    const raw = readFileSync(skill.filePath, "utf8");
    return fm(raw).body;
}

// ---------------------------------------------------------------------------
// Standalone entry point
// ---------------------------------------------------------------------------

export async function startMcpServer(params: IMcpServerParams = {}): Promise<void> {
    const cwd = process.cwd();
    const builtInSkillsDir = join(__dirname, "..", "skills");
    const skillsOverride = params.skills;
    const additionalSkillsDirs = params.additionalSkills || [];

    const baseDir = skillsOverride ? resolve(cwd, skillsOverride) : builtInSkillsDir;

    // skillsDirs[0] = highest priority, skillsDirs[last] = lowest priority
    const skillsDirs = [...[...additionalSkillsDirs].map(p => resolve(cwd, p)).reverse(), baseDir];

    if (skillsOverride) {
        console.error(`[webiny-mcp] skills override: ${baseDir}`);
    }
    for (const d of additionalSkillsDirs) {
        console.error(`[webiny-mcp] additional skills: ${resolve(cwd, d)}`);
    }

    // In-memory cache: populated on first list, reused by get.
    let skillsCache: Map<string, Skill> | null = null;

    function getSkills(): Map<string, Skill> {
        if (!skillsCache) {
            skillsCache = discoverSkills(skillsDirs);
            console.error(`[webiny-mcp] discovered ${skillsCache.size} skill(s)`);
        }
        return skillsCache;
    }

    // ---------------------------------------------------------------
    // MCP server
    // ---------------------------------------------------------------

    const server = new McpServer({ name: "webiny", version: getVersion() });

    server.registerTool(
        "list_webiny_skills",
        {
            title: "List Webiny Skills",
            description:
                "Returns a catalog of all available Webiny skills with names and descriptions. " +
                "Always call this first when working on anything Webiny-related, then call " +
                "get_webiny_skill to load the specific skill you need.",
            inputSchema: {},
            annotations: { readOnlyHint: true }
        },
        async () => ({
            content: [{ type: "text", text: buildCatalog(getSkills()) }]
        })
    );

    server.registerTool(
        "get_webiny_skill",
        {
            title: "Get Webiny Skill",
            description:
                "Loads the full Webiny documentation for a specific skill. " +
                "Call list_webiny_skills first to see available skill names.",
            inputSchema: {
                topic: z.string().describe("Skill name — use exact names from list_webiny_skills")
            },
            annotations: { readOnlyHint: true }
        },
        async ({ topic }) => {
            const skills = getSkills();
            const skill = skills.get(topic);
            if (!skill) {
                const available = [...skills.keys()].sort();
                return {
                    content: [
                        {
                            type: "text",
                            text:
                                `Skill not found: "${topic}".\n\n` +
                                `Available skills: ${available.join(", ") || "(none)"}.`
                        }
                    ],
                    isError: true
                };
            }
            return {
                content: [{ type: "text", text: readSkillContent(skill) }]
            };
        }
    );

    // ---------------------------------------------------------------
    // Start
    // ---------------------------------------------------------------

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("[webiny-mcp] server ready");
}
