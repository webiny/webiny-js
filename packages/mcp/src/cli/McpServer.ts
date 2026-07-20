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
 * Recursively find all files matching `fileName` under `dir`.
 */
function findFiles(dir: string, fileName: string): string[] {
    if (!existsSync(dir)) {
        return [];
    }
    const results: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...findFiles(fullPath, fileName));
        } else if (entry.isFile() && entry.name === fileName) {
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
        for (const filePath of findFiles(dir, "SKILL.md")) {
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
// Agent discovery
// ---------------------------------------------------------------------------

interface AgentAttributes {
    name: string;
    description: string;
    skills?: string[];
}

interface Agent {
    name: string;
    description: string;
    skills: string[];
    filePath: string;
}

function discoverAgents(skillsDirs: string[]): Map<string, Agent> {
    const agents = new Map<string, Agent>();

    for (const dir of skillsDirs) {
        for (const filePath of findFiles(dir, "AGENT.md")) {
            try {
                const raw = readFileSync(filePath, "utf8");
                const parsed = fm<AgentAttributes>(raw);
                const { name, description } = parsed.attributes;

                if (!name || !description) {
                    console.error(`[webiny-mcp] skipping ${filePath}: missing name or description`);
                    continue;
                }

                if (!agents.has(name)) {
                    agents.set(name, {
                        name,
                        description,
                        skills: parsed.attributes.skills || [],
                        filePath
                    });
                }
            } catch (err) {
                console.error(`[webiny-mcp] error reading ${filePath}:`, err);
            }
        }
    }

    return agents;
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

function buildAgentCatalog(agents: Map<string, Agent>): string {
    const lines: string[] = [`# Webiny Agents  (v${getVersion()})`, ""];

    if (agents.size === 0) {
        lines.push(
            "_(No agents found. Add AGENT.md files with front-matter to a skills/agents directory.)_"
        );
        return lines.join("\n");
    }

    lines.push(
        "Agents bundle related skills into task-oriented workflows. " +
            "Use `get_webiny_agent` to load the full agent blueprint, " +
            "then `get_webiny_skill` to load each skill it references.",
        ""
    );
    lines.push("| Agent | Description | Skills |");
    lines.push("|---|---|---|");
    for (const agent of [...agents.values()].sort((a, b) => a.name.localeCompare(b.name))) {
        const desc = agent.description.replace(/\n/g, " ").trim();
        const skills = agent.skills.map(s => `\`${s}\``).join(", ") || "_(none)_";
        lines.push(`| \`${agent.name}\` | ${desc} | ${skills} |`);
    }
    lines.push("");

    return lines.join("\n");
}

function readAgentContent(agent: Agent, skills: Map<string, Skill>): string {
    const raw = readFileSync(agent.filePath, "utf8");
    const body = fm(raw).body;

    const lines: string[] = [body, "", "---", "", "## Skills"];

    if (agent.skills.length === 0) {
        lines.push("", "This agent has no linked skills.");
    } else {
        lines.push("", "Load these skills with `get_webiny_skill` to get full documentation:", "");
        for (const skillName of agent.skills) {
            const skill = skills.get(skillName);
            if (skill) {
                lines.push(`- \`${skillName}\` — ${skill.description.replace(/\n/g, " ").trim()}`);
            } else {
                lines.push(`- \`${skillName}\` — ⚠ not found in skill catalog`);
            }
        }
    }

    return lines.join("\n");
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

    // In-memory caches: populated on first list, reused by get.
    let skillsCache: Map<string, Skill> | null = null;
    let agentsCache: Map<string, Agent> | null = null;

    function getSkills(): Map<string, Skill> {
        if (!skillsCache) {
            skillsCache = discoverSkills(skillsDirs);
            console.error(`[webiny-mcp] discovered ${skillsCache.size} skill(s)`);
        }
        return skillsCache;
    }

    function getAgents(): Map<string, Agent> {
        if (!agentsCache) {
            agentsCache = discoverAgents(skillsDirs);
            console.error(`[webiny-mcp] discovered ${agentsCache.size} agent(s)`);
        }
        return agentsCache;
    }

    // ---------------------------------------------------------------
    // MCP server
    // ---------------------------------------------------------------

    const server = new McpServer({ name: "webiny", version: getVersion() });

    server.registerTool(
        "get_started",
        {
            title: "Get Started with Webiny",
            description:
                "Returns the Webiny routing guide — a decision tree that maps your task " +
                "to the right specialist agent and skills. Call this first before any " +
                "Webiny-related work.",
            inputSchema: {},
            annotations: { readOnlyHint: true }
        },
        async () => {
            const agents = getAgents();
            const rootAgent = agents.get("webiny");
            if (!rootAgent) {
                return {
                    content: [
                        {
                            type: "text",
                            text:
                                "No root routing agent found. " +
                                "Use `list_webiny_agents` or `list_webiny_skills` to browse available resources."
                        }
                    ]
                };
            }
            return {
                content: [{ type: "text", text: readAgentContent(rootAgent, getSkills()) }]
            };
        }
    );

    server.registerTool(
        "list_webiny_skills",
        {
            title: "List Webiny Skills",
            description:
                "Returns a catalog of all available Webiny skills with names and descriptions. " +
                "Prefer calling get_started() first to get routed to the right specialist " +
                "agent. Use this tool for direct skill lookups or when the task doesn't " +
                "fit any specialist agent.",
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

    server.registerTool(
        "list_webiny_agents",
        {
            title: "List Webiny Agents",
            description:
                "Returns a catalog of all available Webiny agents. " +
                "Agents are task-oriented blueprints that bundle related skills " +
                "into workflows. Use get_webiny_agent to load the full blueprint, " +
                "then get_webiny_skill to load each skill it references.",
            inputSchema: {},
            annotations: { readOnlyHint: true }
        },
        async () => ({
            content: [{ type: "text", text: buildAgentCatalog(getAgents()) }]
        })
    );

    server.registerTool(
        "get_webiny_agent",
        {
            title: "Get Webiny Agent",
            description:
                "Loads the full blueprint for a Webiny agent. " +
                "The blueprint includes the agent's system prompt and a list of " +
                "skills to load with get_webiny_skill. " +
                "Call list_webiny_agents first to see available agent names.",
            inputSchema: {
                name: z.string().describe("Agent name — use exact names from list_webiny_agents")
            },
            annotations: { readOnlyHint: true }
        },
        async ({ name }) => {
            const agents = getAgents();
            const agent = agents.get(name);
            if (!agent) {
                const available = [...agents.keys()].sort();
                return {
                    content: [
                        {
                            type: "text",
                            text:
                                `Agent not found: "${name}".\n\n` +
                                `Available agents: ${available.join(", ") || "(none)"}.`
                        }
                    ],
                    isError: true
                };
            }
            return {
                content: [{ type: "text", text: readAgentContent(agent, getSkills()) }]
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
