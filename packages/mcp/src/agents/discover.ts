import { readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import type { AgentPreset, AgentModule } from "./types.js";

let cache: Map<string, AgentModule> | null = null;

export async function discoverAgents(): Promise<Map<string, AgentModule>> {
    if (cache) {
        return cache;
    }

    const agentsDir = dirname(fileURLToPath(import.meta.url));
    const files = readdirSync(agentsDir).filter(
        f => f.endsWith(".js") && !f.endsWith(".d.ts") && !f.endsWith(".js.map")
    );

    const agents = new Map<string, AgentModule>();

    for (const file of files) {
        const mod = await import(join(agentsDir, file));
        if (mod.preset && typeof mod.init === "function") {
            agents.set(mod.preset.slug, { preset: mod.preset, init: mod.init });
        }
    }

    cache = agents;
    return agents;
}

export async function discoverPresets(): Promise<AgentPreset[]> {
    const agents = await discoverAgents();
    return Array.from(agents.values()).map(a => a.preset);
}
