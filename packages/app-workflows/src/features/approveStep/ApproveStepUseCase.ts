import {
    ApproveStepUseCase as UseCaseAbstraction,
    ApproveStepGateway,
    type IApproveStepParams
} from "./abstractions.js";

class ApproveStepUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: ApproveStepGateway.Interface) {}

    async execute(params: IApproveStepParams) {
        return this.gateway.execute(params);
    }
}

export const ApproveStepUseCase = UseCaseAbstraction.createImplementation({
    implementation: ApproveStepUseCaseImpl,
    dependencies: [ApproveStepGateway]
});
