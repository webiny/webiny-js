import { AutomationDefinition } from "~/features/automation/AutomationDefinition/abstractions.js";
import { AutomationDefinitionRegistryService as Abstraction } from "./abstractions.js";

class AutomationDefinitionRegistryServiceImpl implements Abstraction.Interface {
    private readonly definitions = new Map<string, AutomationDefinition.Interface>();

    public constructor(definitions: AutomationDefinition.Interface[]) {
        for (const definition of definitions) {
            this.definitions.set(definition.id, definition);
        }
    }

    public get(id: string): AutomationDefinition.Interface | null {
        return this.definitions.get(id) ?? null;
    }

    public list(): AutomationDefinition.Interface[] {
        return [...this.definitions.values()];
    }
}

export const AutomationDefinitionRegistryService = Abstraction.createImplementation({
    implementation: AutomationDefinitionRegistryServiceImpl,
    dependencies: [[AutomationDefinition, { multiple: true }]]
});
