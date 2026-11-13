import { createFeature } from "@webiny/feature/admin";
import { SendTestMailUseCase as UseCaseAbstraction } from "./abstractions.js";
import { SendTestMailUseCase } from "./SendTestMailUseCase.js";
import { SendTestMailGateway } from "./SendTestMailGateway.js";

export const SendTestMailFeature = createFeature({
    name: "Mailer/SendTestMail",
    register(container) {
        container.register(SendTestMailUseCase);
        container.register(SendTestMailGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
