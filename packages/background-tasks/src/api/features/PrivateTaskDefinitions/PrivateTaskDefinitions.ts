import { PrivateTaskDefinitions as Abstraction } from "./abstractions.js";
import { ListTaskDefinitionsUseCase } from "~/api/features/ListTaskDefinitions/abstractions.js";

class PrivateTaskDefinitionsImpl implements Abstraction.Interface {
    public constructor(
        private readonly listTaskDefinitions: ListTaskDefinitionsUseCase.Interface
    ) {}

    public getIds(): string[] {
        return this.listTaskDefinitions
            .execute()
            .filter(definition => definition.isPrivate === true)
            .map(definition => definition.id);
    }

    public isPrivate(definitionId: string): boolean {
        return this.getIds().includes(definitionId);
    }
}

export const PrivateTaskDefinitions = Abstraction.createImplementation({
    implementation: PrivateTaskDefinitionsImpl,
    dependencies: [ListTaskDefinitionsUseCase]
});
