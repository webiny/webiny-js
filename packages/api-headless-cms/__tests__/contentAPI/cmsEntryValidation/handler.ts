import type { GraphQLHandlerParams } from "~tests/testHelpers/useGraphQLHandler";
import { useGraphQLHandler } from "~tests/testHelpers/useGraphQLHandler";
import type { CmsApiModel } from "~/plugins";
import {
    validateMutation,
    createMutation,
    updateMutation,
    createRevisionMutation,
    publishMutation
} from "./handler.graphql";

interface Params extends Partial<GraphQLHandlerParams> {
    model: Pick<CmsApiModel, "singularApiName">;
}

export const useValidationManageHandler = (params: Params) => {
    const contentHandler = useGraphQLHandler({
        path: "manage",
        ...params
    });

    return {
        ...contentHandler,
        async validate(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: validateMutation(params.model),
                    variables
                },
                headers
            });
        },
        async create(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: createMutation(params.model),
                    variables
                },
                headers
            });
        },
        async createRevision(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: createRevisionMutation(params.model),
                    variables
                },
                headers
            });
        },
        async update(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: updateMutation(params.model),
                    variables
                },
                headers
            });
        },
        async publish(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: publishMutation(params.model),
                    variables
                },
                headers
            });
        }
    };
};
