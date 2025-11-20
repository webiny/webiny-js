import type { CmsModel, CmsModelAst, CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import type { IExportedCmsModel } from "~/tasks/domain/abstractions/ExportContentEntriesController.js";
import { ModelFieldTraverser } from "@webiny/api-headless-cms/utils/index.js";
import { WebinyError } from "@webiny/error";
import { ModelToAstConverter } from "@webiny/api-headless-cms/features/contentModel/ModelToAstConverter/index.js";

export interface IMakeSureModelsAreIdenticalParams {
    modelToAstConverter: ModelToAstConverter.Interface;
    model: CmsModel;
    target: IExportedCmsModel;
}

interface IResult {
    key: string;
    path: string;
    field: CmsModelField;
}

const getModelValues = (ast: CmsModelAst): IResult[] => {
    const traverser = new ModelFieldTraverser();

    const results: IResult[] = [];

    traverser.traverse(ast, ({ field, path }) => {
        const ref = field.settings?.models
            ? `#R#${field.settings.models
                  .map(m => m.modelId)
                  .sort()
                  .join(",")}`
            : "";

        const key = `${field.type}@${path.join(".")}#${field.multipleValues ? "m" : "s"}${ref}`;
        results.push({
            key,
            field,
            path: path.join(".")
        });
    });

    return results;
};

export const makeSureModelsAreIdentical = (params: IMakeSureModelsAreIdenticalParams): void => {
    const { modelToAstConverter, model, target } = params;

    const modelAst = modelToAstConverter.toAst(model);
    const targetAst = modelToAstConverter.toAst(target as CmsModel);

    const modelValues = getModelValues(modelAst);
    const targetValues = getModelValues(targetAst);
    /**
     * First we will go through the model from the database.
     * Then we will go through the exported model and check against the model from the database.
     */
    for (const value of modelValues) {
        if (targetValues.some(v => v.key === value.key)) {
            continue;
        }
        throw new WebinyError({
            message: `Field "${value.field.fieldId}" not found in the model provided via the JSON data.`,
            code: "MODEL_FIELD_NOT_FOUND",
            data: {
                field: value,
                targetValues,
                modelValues
            }
        });
    }
    for (const value of targetValues) {
        if (modelValues.some(v => v.key === value.key)) {
            continue;
        }
        throw new WebinyError({
            message: `Field "${value.field.fieldId}" not found in the model from the database.`,
            code: "MODEL_FIELD_NOT_FOUND",
            data: {
                ...value
            }
        });
    }
};
