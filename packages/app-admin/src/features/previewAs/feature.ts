import { createFeature } from "@webiny/feature/admin";
import type { Container } from "@webiny/di";
import { PreviewContext as PreviewContextAbstraction } from "./abstractions.js";
import { PreviewAsUseCase as PreviewAsUseCaseAbstraction } from "./abstractions.js";
import { PreviewContext } from "./PreviewContext.js";
import { PreviewAsUseCase } from "./PreviewAsUseCase.js";
import { GraphQLClientDecorator } from "./GraphQLClientDecorator.js";
import { ApiStreamClientDecorator } from "./ApiStreamClientDecorator.js";
import { ListPreviewCandidatesGateway } from "./ListPreviewCandidatesGateway.js";
import { ListPreviewCandidatesUseCase } from "./ListPreviewCandidatesUseCase.js";
import { LogInUseCaseDecorator } from "./LogInUseCaseDecorator.js";
import { LogOutUseCaseDecorator } from "./LogOutUseCaseDecorator.js";

export const PreviewAsFeature = createFeature({
    name: "PreviewAs",
    register(container: Container) {
        container.register(PreviewContext).inSingletonScope();
        container.register(PreviewAsUseCase);
        container.register(ListPreviewCandidatesGateway).inSingletonScope();
        container.register(ListPreviewCandidatesUseCase);
        container.registerDecorator(GraphQLClientDecorator);
        container.registerDecorator(ApiStreamClientDecorator);
        container.registerDecorator(LogInUseCaseDecorator);
        container.registerDecorator(LogOutUseCaseDecorator);
    },
    resolve(container: Container) {
        return {
            context: container.resolve(PreviewContextAbstraction),
            useCase: container.resolve(PreviewAsUseCaseAbstraction)
        };
    }
});
