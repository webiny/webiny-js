import {
    CheckEmailGateway,
    CheckEmailUseCase as UseCaseAbstraction,
    type EmailStatus
} from "./abstractions/index.js";

class CheckEmailUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: CheckEmailGateway.Interface) {}

    async execute(email: string): Promise<EmailStatus> {
        return this.gateway.execute(email.trim());
    }
}

export const CheckEmailUseCase = UseCaseAbstraction.createImplementation({
    implementation: CheckEmailUseCaseImpl,
    dependencies: [CheckEmailGateway]
});
