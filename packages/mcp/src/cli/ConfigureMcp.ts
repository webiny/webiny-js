import type { IUi } from "../ui.js";
import { ConsoleUi } from "../ui.js";
import { discoverAgents } from "../agents/discover.js";

export interface IConfigureMcpParams {
    agent?: string;
    instructions?: boolean;
    ui?: IUi;
    cwd?: string;
}

export async function configureMcp(params: IConfigureMcpParams = {}): Promise<void> {
    const ui = params.ui ?? new ConsoleUi();
    const cwd = params.cwd ?? process.cwd();

    if (params.instructions) {
        const { printInstructions } = await import("../agents/instructions.js");
        await printInstructions();
        return;
    }

    const agents = await discoverAgents();
    const supported = Array.from(agents.keys());
    const target = params.agent;

    if (!target) {
        ui.text("Available agents:");
        ui.emptyLine();
        for (const [slug, { preset }] of agents) {
            ui.text(`  ${slug.padEnd(12)} ${preset.displayName}`);
        }
        ui.emptyLine();
        ui.text("Usage: npx webiny-mcp configure <agent>");
        ui.text("For other agents, run: npx webiny-mcp configure --instructions");
        return;
    }

    if (!agents.has(target)) {
        ui.error(`Unknown agent "${target}".`);
        ui.text(`Supported: ${supported.join(", ")}`);
        ui.text("For other agents, run: npx webiny-mcp configure --instructions");
        process.exit(1);
    }

    const { init } = agents.get(target)!;
    await init({ ui, cwd });
}
