import type { IUi } from "../ui.js";
import { ConsoleUi } from "../ui.js";

export interface IConfigureMcpParams {
    agent?: string;
    instructions?: boolean;
    ui?: IUi;
    cwd?: string;
}

const SUPPORTED = ["claude", "cursor", "windsurf", "copilot", "cline", "opencode"];

export async function configureMcp(params: IConfigureMcpParams = {}): Promise<void> {
    const ui = params.ui ?? new ConsoleUi();
    const cwd = params.cwd ?? process.cwd();

    if (params.instructions) {
        const { printInstructions } = await import("../agents/instructions.js");
        printInstructions();
        return;
    }

    const target = params.agent || "claude";

    if (!SUPPORTED.includes(target)) {
        ui.error(`Unknown agent "${target}".`);
        ui.text(`Supported: ${SUPPORTED.join(", ")}`);
        ui.text("For other agents, run: npx webiny-mcp configure --instructions");
        process.exit(1);
    }

    const { init } = await import(`../agents/${target}.js`);
    await init({ ui, cwd });
}
