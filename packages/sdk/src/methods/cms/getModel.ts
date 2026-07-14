import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, NetworkError, ValidationError } from "../../errors.js";
import { createMethod } from "../../utils/createMethod.js";
import { getModelSchema } from "./schemas.js";
import { executeGraphQL } from "../executeGraphQL.js";
import { ApiError } from "../../errors.js";

export interface CmsModelField {
    id: string;
    fieldId: string;
    type: string;
    label: string;
    list?: boolean;
    settings?: Record<string, unknown>;
}

export interface CmsModelData {
    name: string;
    modelId: string;
    singularApiName: string;
    pluralApiName: string;
    description?: string;
    titleFieldId?: string;
    descriptionFieldId?: string;
    imageFieldId?: string;
    fields: CmsModelField[];
    layout: string[][];
    tags: string[];
    settings?: Record<string, unknown>;
    componentMap?: Record<string, string>;
    metadata?: {
        valuesSelection?: string;
        refModels?: Record<string, { valuesSelection: string }>;
    };
}

export interface GetModelParams {
    modelId: string;
}

const _impl = createMethod(getModelSchema, async (config, fetchFn, { modelId }) => {
    const query = `
        query GetModel($modelId: ID!) {
            cms {
                getModel(modelId: $modelId) {
                    data
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

    const result = await executeGraphQL(config, fetchFn, query, { modelId });

    if (result.isFail()) {
        return Result.fail(result.error);
    }

    const responseData = result.value;

    if (responseData.cms.getModel.error) {
        return Result.fail(
            new ApiError(
                responseData.cms.getModel.error.message,
                responseData.cms.getModel.error.code
            )
        );
    }

    return Result.ok(responseData.cms.getModel.data);
});

export function getModel(
    config: WebinyConfig,
    fetchFn: typeof fetch,
    params: GetModelParams
): Promise<Result<CmsModelData, HttpError | ApiError | NetworkError | ValidationError>> {
    return _impl(config, fetchFn, params) as Promise<
        Result<CmsModelData, HttpError | ApiError | NetworkError | ValidationError>
    >;
}
