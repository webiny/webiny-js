import type { ApolloClient } from "@apollo/client";
import type {
    IDeleteCmsModelTask,
    IFullyDeleteCmsModelMutationResponse,
    IFullyDeleteCmsModelMutationVariables
} from "~/admin/viewsGraphql.js";
import { FULLY_DELETE_CONTENT_MODEL } from "~/admin/viewsGraphql.js";
import type { CmsErrorResponse, CmsModel } from "~/types.js";
import type { DataProxy } from "apollo-cache";

export interface ICreateProcessParams {
    client: ApolloClient;
}

export interface IProcessParams {
    confirmation: string;
    model: CmsModel;
    onSuccess: (cache: DataProxy, data: IDeleteCmsModelTask) => void;
}

export interface IProcessResponseSuccess {
    error?: never;
    data: IDeleteCmsModelTask;
}

export interface IProcessResponseError {
    error: CmsErrorResponse;
    data?: never;
}

type IProcessResponse = IProcessResponseSuccess | IProcessResponseError;

export const createProcessConfirmation = ({ client }: ICreateProcessParams) => {
    return async ({
        model,
        confirmation,
        onSuccess
    }: IProcessParams): Promise<IProcessResponse> => {
        try {
            const result = await client.mutate<
                IFullyDeleteCmsModelMutationResponse,
                IFullyDeleteCmsModelMutationVariables
            >({
                mutation: FULLY_DELETE_CONTENT_MODEL,
                variables: {
                    modelId: model.modelId,
                    confirmation: confirmation
                },
                update: (cache, { data }) => {
                    if (!data?.fullyDeleteModel?.data) {
                        return;
                    }
                    onSuccess(cache, data.fullyDeleteModel.data);
                }
            });
            const fullyDeleteModel = result.data?.fullyDeleteModel;
            if (!fullyDeleteModel) {
                return {
                    error: {
                        message:
                            "Missing data on Mutation Response. Please check your network tab for more info.",
                        code: "FULLY_DELETE_MODEL_ERROR",
                        data: {}
                    }
                };
            } else if (fullyDeleteModel.error) {
                return {
                    error: fullyDeleteModel.error
                };
            } else if (!fullyDeleteModel.data) {
                const graphQlError = result.errors?.[0];
                const error = {
                    message: graphQlError?.message || "No data received.",
                    code: "FULLY_DELETE_MODEL_NO_DATA",
                    data: {}
                };
                return {
                    error
                };
            }
            return {
                data: fullyDeleteModel.data
            };
        } catch (ex) {
            return {
                error: ex
            };
        }
    };
};
