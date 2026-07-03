import {
    StartStepUseCase as UseCaseAbstraction,
    StartStepGateway,
    type IStartStepParams
} from "./abstractions.js";

class StartStepUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: StartStepGateway.Interface) {}

    async execute(params: IStartStepParams) {
        return this.gateway.execute(params);
    }
}

export const StartStepUseCase = UseCaseAbstraction.createImplementation({
    implementation: StartStepUseCaseImpl,
    dependencies: [StartStepGateway]
});
