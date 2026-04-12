import { createFeature } from "@webiny/feature/admin";
import {
    GetPageUseCase as UseCaseAbstraction,
    GetPageGateway as GatewayAbstraction,
    GetPageGraphQLFieldSelection
} from "./abstractions.js";
import { GetPageUseCase } from "./GetPageUseCase.js";
import { GetPageRepository } from "./GetPageRepository.js";
import { GetPageGatewayImpl } from "./GetPageGateway.js";
import { GetPageUseCaseWithLoading } from "./GetPageUseCaseWithLoading.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";

export const GetPageFeature = createFeature({
    name: "WebsiteBuilder/GetPage",
    register(container) {
        container.register(GetPageUseCase);
        container.register(GetPageRepository).inSingletonScope();
        container.registerFactory(GatewayAbstraction, () => {
            const client = container.resolve(MainGraphQLClient);
            const fieldSelections = container.resolveAll(GetPageGraphQLFieldSelection);
            return new GetPageGatewayImpl(client, fieldSelections);
        });
        container.registerDecorator(GetPageUseCaseWithLoading);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
