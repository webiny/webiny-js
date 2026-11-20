import { CreatePageUseCase } from "~/features/pages/CreatePage/index.js";
import { DocumentElements } from "~/domain/globals/DocumentElements.js";

/**
 * Global component instances are stored on their own, never in a page: drop their elements from a new page.
 */
class CreatePageWithoutGlobalComponentsDecorator implements CreatePageUseCase.Interface {
    constructor(private decoratee: CreatePageUseCase.Interface) {}

    async execute(data: CreatePageUseCase.Params): CreatePageUseCase.Return {
        if (data.elements === undefined) {
            return this.decoratee.execute(data);
        }

        return this.decoratee.execute({
            ...data,
            elements: DocumentElements.from(data.elements).withoutGlobalInstances().toJSON()
        });
    }
}

export const CreatePageWithoutGlobalComponents = CreatePageUseCase.createDecorator({
    decorator: CreatePageWithoutGlobalComponentsDecorator,
    dependencies: []
});
