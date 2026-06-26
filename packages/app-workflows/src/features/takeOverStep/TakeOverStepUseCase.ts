import {
    TakeOverStepUseCase as UseCaseAbstraction,
    TakeOverStepGateway,
    type ITakeOverStepParams
} from "./abstractions.js";

class TakeOverStepUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: TakeOverStepGateway.Interface) {}

    async execute(params: ITakeOverStepParams) {
        return this.gateway.execute(params);
    }
}

export const TakeOverStepUseCase = UseCaseAbstraction.createImplementation({
    implementation: TakeOverStepUseCaseImpl,
    dependencies: [TakeOverStepGateway]
});
