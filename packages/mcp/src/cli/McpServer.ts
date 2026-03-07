import { readFileSync, readdirSync, existsSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CliCommandFactory } from "@webiny/cli-core/exports/cli/command.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface IMcpServerParams {
    skills: string;
    "additional-skills": string[];
}

// ---------------------------------------------------------------------------
// Skill resolution
// ---------------------------------------------------------------------------

function getAvailableTopics(skillsDirs: string[]): string[] {
    const seen = new Set<string>();
    for (const dir of skillsDirs) {
        if (!existsSync(dir)) {
            continue;
        }
        readdirSync(dir)
            .filter(f => f.endsWith(".md") && f.toLowerCase() !== "readme.md")
            .forEach(f => seen.add(f.replace(/\.md$/, "")));
    }
    return [...seen].sort();
}

function readSkill(topic: string, skillsDirs: string[]): string | null {
    for (const dir of skillsDirs) {
        const file = join(dir, `${topic}.md`);
        if (existsSync(file)) {
            return readFileSync(file, "utf8");
        }
    }
    return null;
}

// ---------------------------------------------------------------------------
// Index builder
// ---------------------------------------------------------------------------

function getVersion(): string {
    try {
        return createRequire(import.meta.url)("../../package.json").version;
    } catch {
        return "0.0.0";
    }
}

function readIndex(skillsDirs: string[], baseDir: string): string {
    const sections: string[] = [`# Webiny Skills  (v${getVersion()})`, ""];

    for (const dir of skillsDirs) {
        const readme = join(dir, "README.md");
        if (!existsSync(readme)) {
            continue;
        }
        const content = readFileSync(readme, "utf8").trim();
        if (dir !== baseDir) {
            sections.push(`---`, "", `## Additional Skills (${dir})`, "");
        }
        sections.push(content, "");
    }

    if (sections.length <= 2) {
        sections.push(
            "_(No README.md found in any skills directory. Add a README.md to describe available skills.)_"
        );
    }

    return sections.join("\n");
}

// ---------------------------------------------------------------------------
// CLI Command
// ---------------------------------------------------------------------------

class McpServerCommand implements CliCommandFactory.Interface<IMcpServerParams> {
    execute(): CliCommandFactory.CommandDefinition<IMcpServerParams> {
        return {
            name: "mcp-server",
            description: "Start the Webiny MCP server (stdio transport).",
            examples: [
                "$0 mcp-server",
                "$0 mcp-server --skills=./my-skills",
                "$0 mcp-server --additional-skills=./extra-skills"
            ],
            options: [
                {
                    name: "skills",
                    description:
                        "Replace the built-in skills folder entirely. Only skills found in the given path will be served.",
                    type: "string"
                },
                {
                    name: "additional-skills",
                    description:
                        "Add a folder on top of the built-in (or --skills) folder. Can be repeated.",
                    type: "string",
                    array: true
                }
            ],
            handler: async params => {
                const cwd = process.cwd();
                const builtInSkillsDir = join(__dirname, "..", "skills");
                const skillsOverride = params.skills;
                const additionalSkillsDirs = params["additional-skills"] || [];

                const baseDir = skillsOverride ? resolve(cwd, skillsOverride) : builtInSkillsDir;

                // skillsDirs[0] = highest priority, skillsDirs[last] = lowest priority
                const skillsDirs = [
                    ...[...additionalSkillsDirs].map(p => resolve(cwd, p)).reverse(),
                    baseDir
                ];

                if (skillsOverride) {
                    console.error(`[webiny-mcp] skills override: ${baseDir}`);
                }
                for (const d of additionalSkillsDirs) {
                    console.error(`[webiny-mcp] additional skills: ${resolve(cwd, d)}`);
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
                            "Returns the skill index (README) describing all available Webiny skills. " +
                            "Always call this first when working on anything Webiny-related, then call " +
                            "get_webiny_skill to load the specific skill you need.",
                        inputSchema: {},
                        annotations: { readOnlyHint: true }
                    },
                    async () => ({
                        content: [{ type: "text", text: readIndex(skillsDirs, baseDir) }]
                    })
                );

                // @ts-expect-error Incompatible Zod version
                server.registerTool(
                    "get_webiny_skill",
                    {
                        title: "Get Webiny Skill",
                        description:
                            "Loads the full Webiny documentation for a specific topic. " +
                            "Call list_webiny_skills first to see available topics.",
                        inputSchema: {
                            topic: z
                                .string()
                                .describe("Skill topic — use exact names from list_webiny_skills")
                        },
                        annotations: { readOnlyHint: true }
                    },
                    async ({ topic }) => {
                        const content = readSkill(topic, skillsDirs);
                        if (!content) {
                            const available = getAvailableTopics(skillsDirs);
                            return {
                                content: [
                                    {
                                        type: "text",
                                        text:
                                            `Skill not found: "${topic}".\n\n` +
                                            `Available topics: ${available.join(", ") || "(none)"}.\n\n` +
                                            `To add this skill, create: <skills-dir>/${topic}.md`
                                    }
                                ],
                                isError: true
                            };
                        }
                        return { content: [{ type: "text", text: content }] };
                    }
                );

                // ---------------------------------------------------------------
                // Start
                // ---------------------------------------------------------------

                const transport = new StdioServerTransport();
                await server.connect(transport);
                console.error("[webiny-mcp] server ready");
            }
        };
    }
}

export default CliCommandFactory.createImplementation({
    implementation: McpServerCommand,
    dependencies: []
});
