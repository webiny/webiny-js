import React, { useEffect, useRef } from "react";
import { useCms } from "~/admin/hooks";
import { CmsErrorResponse, CmsModel } from "~/types";
import {
    CmsEntryDeleteMutationResponse,
    CmsEntryDeleteMutationVariables,
    createDeleteMutation
} from "@webiny/app-headless-cms-common";
import { DocumentNode } from "graphql";
import { OnEntryDeleteRequest } from "~/admin/contexts/Cms";
import { parseIdentifier } from "@webiny/utils";

interface Mutations {
    [key: string]: DocumentNode;
}

interface CreateMutationKeyParams {
    model: CmsModel;
    locale: string;
}

const createMutationKey = (params: CreateMutationKeyParams): string => {
    const { model, locale } = params;
    return `${model.modelId}_${locale}_${model.savedOn}`;
};

const OnEntryDelete = () => {
    const { onEntryDelete } = useCms();

    const mutations = useRef<Mutations>({});

    const getMutation = (model: CmsModel, locale: string) => {
        const key = createMutationKey({ model, locale });
        if (!mutations.current[key]) {
            mutations.current[key] = createDeleteMutation(model);
        }
        return mutations.current[key];
    };

    const handleOnDelete = async (params: OnEntryDeleteRequest) => {
        const { entry, model, id, client, locale } = params;
        const mutation = getMutation(model, locale);

        const response = await client.mutate<
            CmsEntryDeleteMutationResponse,
            CmsEntryDeleteMutationVariables
        >({
            mutation,
            variables: {
                revision: id,
                permanently: false
            }
        });

        if (!response.data) {
            const error: CmsErrorResponse = {
                message: "Missing response data on Delete Entry Mutation.",
                code: "MISSING_RESPONSE_DATA",
                data: {}
            };
            return {
                error
            };
        }
        const { error } = response.data.content;
        if (error) {
            return {
                error
            };
        }
        /**
         * TODO figure out how to do this in a smart way.
         * If there is no version in the ID, we are deleting whole entry.
         */
        const { version } = parseIdentifier(id);
        if (version === null) {
            return {
                data: true,
                error: null
            };
        }

        if (entry.id !== id) {
            return {
                data: true,
                error: null
            };
        }
        return {
            entry,
            data: true,
            error: null
        };
    };

    useEffect(() => {
        return onEntryDelete(next => async params => {
            const result = await next(params);

            if (result.error) {
                return result;
            }

            const response = await handleOnDelete({
                ...params
            });
            return {
                ...result,
                ...response
            };
        });
    }, []);

    return null;
};

export const DefaultOnEntryDelete = React.memo(OnEntryDelete);
