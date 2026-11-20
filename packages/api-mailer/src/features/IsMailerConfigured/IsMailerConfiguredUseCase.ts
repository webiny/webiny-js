import { IsMailerConfiguredUseCase } from "./abstractions.js";
import { MailerService } from "~/domain/MailerService/abstractions.js";

class IsMailerConfiguredUseCaseImpl implements IsMailerConfiguredUseCase.Interface {
    constructor(private mailerService: MailerService.Interface) {}

    execute(): IsMailerConfiguredUseCase.Return {
        return this.mailerService.isConfigured();
    }
}

export const IsMailerConfiguredUseCaseImplementation =
    IsMailerConfiguredUseCase.createImplementation({
        implementation: IsMailerConfiguredUseCaseImpl,
        dependencies: [MailerService]
    });
