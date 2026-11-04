import { UpdatePageUseCase } from "~/features/pages/UpdatePage/index.js";
import { DocumentElements } from "~/domain/globals/DocumentElements.js";

/**
 * Global component instances are stored on their own, never in a page: drop their elements from the update.
 * Bindings are stored as sent: a binding under a global's (or one of its elements') id is the page's override.
 */
class UpdatePageWithoutGlobalComponentsDecorator implements UpdatePageUseCase.Interface {
    constructor(private decoratee: UpdatePageUseCase.Interface) {}

    async execute(id: string, data: UpdatePageUseCase.UpdateData): UpdatePageUseCase.Return {
        if (data.elements === undefined) {
            return this.decoratee.execute(id, data);
        }

        return this.decoratee.execute(id, {
            ...data,
            elements: DocumentElements.from(data.elements).withoutGlobalInstances().toJSON()
        });
    }
}

export const UpdatePageWithoutGlobalComponents = UpdatePageUseCase.createDecorator({
    decorator: UpdatePageWithoutGlobalComponentsDecorator,
    dependencies: []
});
