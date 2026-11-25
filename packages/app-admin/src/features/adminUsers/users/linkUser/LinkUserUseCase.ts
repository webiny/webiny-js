import {
    LinkUserGateway,
    LinkUserUseCase as UseCaseAbstraction,
    type ILinkUserUseCaseParams,
    type ILinkUserUseCaseResult
} from "./abstractions/index.js";

class LinkUserUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: LinkUserGateway.Interface) {}

    async execute(params: ILinkUserUseCaseParams): Promise<ILinkUserUseCaseResult> {
        return this.gateway.execute(params);
    }
}

export const LinkUserUseCase = UseCaseAbstraction.createImplementation({
    implementation: LinkUserUseCaseImpl,
    dependencies: [LinkUserGateway]
});
