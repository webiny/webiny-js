import {
    Tool,
    ToolRegistry as ToolRegistryAbstraction,
    type ITool,
    type IToolRegistry
} from "./abstractions.js";

class ToolRegistryImpl implements IToolRegistry {
    private toolMap: Map<string, ITool>;

    constructor(tools: ITool[]) {
        this.toolMap = new Map(tools.map(t => [t.name, t]));
    }

    getTool(name: string): ITool {
        const tool = this.toolMap.get(name);
        if (!tool) {
            throw new Error(`Tool "${name}" is not registered.`);
        }
        return tool;
    }

    getTools(): ITool[] {
        return [...this.toolMap.values()];
    }

    async invoke(name: string, params: unknown): Promise<unknown> {
        const tool = this.getTool(name);
        const validated = tool.inputSchema.parse(params);
        return tool.execute(validated);
    }
}

export const ToolRegistry = ToolRegistryAbstraction.createImplementation({
    implementation: ToolRegistryImpl,
    dependencies: [[Tool, { multiple: true }]]
});
