import type { IUi } from "../ui.js";

export interface AgentPreset {
    slug: string;
    displayName: string;
    configFile: string;
    configNote?: string;
    hintFile?: string;
    hintNote?: string;
}

export interface AgentModule {
    preset: AgentPreset;
    init: (params: { ui: IUi; cwd: string }) => Promise<void>;
}
