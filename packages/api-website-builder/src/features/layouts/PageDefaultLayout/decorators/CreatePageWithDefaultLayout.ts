import { CreatePageUseCase } from "~/features/pages/CreatePage/index.js";
import { GetLayoutSettingsRepository } from "~/features/layouts/GetLayoutSettings/index.js";

/**
 * A page created without picking a layout (no `properties.layout` at all) gets the tenant's default layout.
 * `properties.layout: null` is a choice: no layout.
 */
class CreatePageWithDefaultLayoutDecorator implements CreatePageUseCase.Interface {
    constructor(
        private getLayoutSettings: GetLayoutSettingsRepository.Interface,
        private decoratee: CreatePageUseCase.Interface
    ) {}

    async execute(data: CreatePageUseCase.Params): CreatePageUseCase.Return {
        const properties = data.properties ?? {};
        if ("layout" in properties) {
            return this.decoratee.execute(data);
        }

        const settings = await this.getLayoutSettings.execute();
        const defaultLayout = settings.isOk() ? settings.value.defaultLayout : null;
        if (!defaultLayout) {
            return this.decoratee.execute(data);
        }

        return this.decoratee.execute({
            ...data,
            properties: { ...properties, layout: defaultLayout }
        });
    }
}

export const CreatePageWithDefaultLayout = CreatePageUseCase.createDecorator({
    decorator: CreatePageWithDefaultLayoutDecorator,
    dependencies: [GetLayoutSettingsRepository]
});
