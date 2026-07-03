import {
    AiOutputTool,
    AiOutputToolRegistry as Abstraction,
    type IAiOutputTool,
    type IAiOutputToolRegistry
} from "./abstractions.js";

class AiOutputToolRegistryImpl implements IAiOutputToolRegistry {
    private toolMap: Map<string, IAiOutputTool>;

    constructor(tools: IAiOutputTool[]) {
        this.toolMap = new Map(tools.map(t => [t.name, t]));
    }

    has(name: string): boolean {
        return this.toolMap.has(name);
    }

    async invoke(name: string, params: Record<string, unknown>): Promise<unknown> {
        const tool = this.toolMap.get(name);
        if (!tool) {
            return undefined;
        }
        return tool.execute(params);
    }
}

export const AiOutputToolRegistry = Abstraction.createImplementation({
    implementation: AiOutputToolRegistryImpl,
    dependencies: [[AiOutputTool, { multiple: true }]]
});
