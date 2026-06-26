import {
    ListCustomIconsUseCase as UseCaseAbstraction,
    ListCustomIconsGateway
} from "./abstractions/index.js";

class ListCustomIconsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: ListCustomIconsGateway.Interface) {}

    async execute(): Promise<UseCaseAbstraction.Result> {
        const icons = await this.gateway.execute();

        return icons.map(icon => ({
            type: "custom",
            name: icon.name,
            value: icon.src
        }));
    }
}

export const ListCustomIconsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListCustomIconsUseCaseImpl,
    dependencies: [ListCustomIconsGateway]
});
