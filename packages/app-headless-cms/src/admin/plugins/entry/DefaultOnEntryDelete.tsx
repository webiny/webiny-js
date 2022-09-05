import React, { useEffect, useRef } from "react";
import { useCms } from "~/admin/hooks";
import { CmsErrorResponse, CmsModel } from "~/types";
import {
    CmsEntryDeleteMutationResponse,
    CmsEntryDeleteMutationVariables,
    createDeleteMutation
} from "~/admin/graphql/contentEntries";
import { DocumentNode } from "graphql";
import { OnEntryDeleteRequest } from "~/admin/contexts/Cms";
import * as GQLCache from "~/admin/views/contentEntries/ContentEntry/cache";
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

const OnEntryDelete: React.FC = () => {
    const { onEntryDelete } = useCms();

    const mutations = useRef<Mutations>({});

    const getMutation = (model: CmsModel, locale: string) => {
        const key = createMutationKey({ model, locale });
        if (!mutations.current[key]) {
            mutations.current[key] = createDeleteMutation(model);
        }
        return mutations.current[key];
    };

    const handleOnDelete = async ({
        entry,
        model,
        id,
        client,
        listQueryVariables = {},
        locale
    }: OnEntryDeleteRequest) => {
        const mutation = getMutation(model, locale);

        const response = await client.mutate<
            CmsEntryDeleteMutationResponse,
            CmsEntryDeleteMutationVariables
        >({
            mutation,
            variables: {
                revision: id
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
            GQLCache.removeEntryFromListCache(model, client.cache, entry, listQueryVariables);
            return {
                data: true,
                error: null
            };
        }

        // We have other revisions, update entry's cache
        const revisions = GQLCache.removeRevisionFromEntryCache(model, client.cache, {
            ...entry,
            id
        });

        if (entry.id !== id) {
            return {
                data: true,
                error: null
            };
        }
        GQLCache.updateLatestRevisionInListCache(
            model,
            client.cache,
            revisions[0],
            listQueryVariables
        );

        return {
            entry: revisions[0] || entry,
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
