import { Result } from "@webiny/feature/api";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { UpdateModelUseCase } from "@webiny/api-headless-cms/features/contentModel/UpdateModel/index.js";
import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import { SetModelFieldRendererUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListAdminExtensionsRepository } from "~/api/adminExtensions/features/ListAdminExtensions/abstractions.js";
import { AdminExtensionModelUpdateError } from "~/api/adminExtensions/domain/errors.js";
import { AdminExtensionNotFoundError } from "~/api/adminExtensions/domain/errors.js";
import { AdminExtensionValidationError } from "~/api/adminExtensions/domain/errors.js";
import { toCmsRendererName } from "~/shared/adminExtensions/fieldRendererRuntime.js";
import type { FieldRendererConfig } from "~/shared/adminExtensions/fieldRendererConfig.js";

function withRenderer(fields: CmsModelField[], fieldId: string, rendererName: string) {
    return fields.map(field => {
        if (field.fieldId !== fieldId) {
            return field;
        }
        return { ...field, renderer: { name: rendererName, settings: null } };
    });
}

class SetModelFieldRendererUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private readonly listRepository: ListAdminExtensionsRepository.Interface,
        private readonly getModel: GetModelUseCase.Interface,
        private readonly updateModel: UpdateModelUseCase.Interface
    ) {}

    async execute(
        input: UseCaseAbstraction.Input
    ): Promise<Result<UseCaseAbstraction.Output, UseCaseAbstraction.Error>> {
        const renderers = await this.listRepository.execute({
            kind: "fieldRenderer",
            name: input.rendererName,
            enabled: true
        });
        if (renderers.isFail()) {
            return Result.fail(renderers.error);
        }
        const [renderer] = renderers.value;
        if (!renderer) {
            return Result.fail(new AdminExtensionNotFoundError(input.rendererName));
        }
        const config: FieldRendererConfig = JSON.parse(renderer.config);

        const modelResult = await this.getModel.execute(input.modelId);
        if (modelResult.isFail()) {
            return Result.fail(new AdminExtensionModelUpdateError(modelResult.error.message));
        }
        const model = modelResult.value;

        const field = model.fields.find(candidate => candidate.fieldId === input.fieldId);
        if (!field) {
            return Result.fail(
                new AdminExtensionValidationError(
                    `Model "${input.modelId}" has no top-level field "${input.fieldId}".`
                )
            );
        }
        if (field.type !== config.fieldType || !!field.list !== config.multipleValues) {
            const expected = config.multipleValues
                ? `a list of ${config.fieldType}`
                : config.fieldType;
            return Result.fail(
                new AdminExtensionValidationError(
                    `"${input.rendererName}" renders ${expected} fields; "${input.fieldId}" is ${field.list ? "a list of " : ""}${field.type}.`
                )
            );
        }

        const cmsRendererName = toCmsRendererName(renderer.name);
        const updated = await this.updateModel.execute(model.modelId, {
            fields: withRenderer(model.fields, field.fieldId, cmsRendererName),
            layout: model.layout
        });
        if (updated.isFail()) {
            return Result.fail(new AdminExtensionModelUpdateError(updated.error.message));
        }

        return Result.ok({ modelId: model.modelId, fieldId: field.fieldId, cmsRendererName });
    }
}

export const SetModelFieldRendererUseCase = UseCaseAbstraction.createImplementation({
    implementation: SetModelFieldRendererUseCaseImpl,
    dependencies: [ListAdminExtensionsRepository, GetModelUseCase, UpdateModelUseCase]
});
