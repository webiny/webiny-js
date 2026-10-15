import { WorkflowAiToolRegistryService } from "@webiny/api-workflows/features/aiTools/WorkflowAiToolRegistryService/index.js";

/** Tool names the registry no longer knows. Clear it in `beforeEach`. */
export const hiddenAiTools = new Set<string>();

class HiddenAiToolRegistryImpl implements WorkflowAiToolRegistryService.Interface {
    public constructor(private decoratee: WorkflowAiToolRegistryService.Interface) {}

    public get(name: string) {
        return hiddenAiTools.has(name) ? null : this.decoratee.get(name);
    }

    public list() {
        return this.decoratee.list().filter(tool => !hiddenAiTools.has(tool.name));
    }
}

export const HiddenAiToolRegistry = WorkflowAiToolRegistryService.createDecorator({
    decorator: HiddenAiToolRegistryImpl,
    dependencies: []
});
