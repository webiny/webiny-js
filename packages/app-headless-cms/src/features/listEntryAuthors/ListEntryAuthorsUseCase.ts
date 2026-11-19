import {
    ListEntryAuthorsUseCase as UseCaseAbstraction,
    ListEntryAuthorsGateway
} from "./abstractions.js";

class ListEntryAuthorsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: ListEntryAuthorsGateway.Interface) {}

    async execute() {
        return this.gateway.execute();
    }
}

export const ListEntryAuthorsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListEntryAuthorsUseCaseImpl,
    dependencies: [ListEntryAuthorsGateway]
});
