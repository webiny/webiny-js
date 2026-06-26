import {
    RejectStepUseCase as UseCaseAbstraction,
    RejectStepGateway,
    type IRejectStepParams
} from "./abstractions.js";

class RejectStepUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: RejectStepGateway.Interface) {}

    async execute(params: IRejectStepParams) {
        return this.gateway.execute(params);
    }
}

export const RejectStepUseCase = UseCaseAbstraction.createImplementation({
    implementation: RejectStepUseCaseImpl,
    dependencies: [RejectStepGateway]
});
