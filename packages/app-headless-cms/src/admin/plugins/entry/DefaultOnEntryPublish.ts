import React, { useCallback, useEffect, useRef } from "react";
import { DocumentNode } from "graphql";
import {
    CmsEntryPublishMutationResponse,
    CmsEntryPublishMutationVariables,
    createPublishMutation
} from "~/admin/graphql/contentEntries";
import { CmsErrorResponse, CmsModel } from "~/types";
import { useCms } from "~/admin/hooks";
import { OnEntryPublishResponse } from "~/admin/contexts/Cms";
import * as GQLCache from "~/admin/views/contentEntries/ContentEntry/cache";

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

const OnEntryPublish: React.FC = () => {
    const { onEntryRevisionPublish } = useCms();

    const mutations = useRef<Mutations>({});

    const getMutation = useCallback(
        (model: CmsModel, locale: string): DocumentNode => {
            const key = createMutationKey({ model, locale });
            if (!mutations.current[key]) {
                mutations.current[key] = createPublishMutation(model);
            }
            return mutations.current[key];
        },
        [mutations.current]
    );

    const handleOnPublish = async ({ model, id, client, locale }: OnEntryPublishResponse) => {
        const mutation = getMutation(model, locale);

        const response = await client.mutate<
            CmsEntryPublishMutationResponse,
            CmsEntryPublishMutationVariables
        >({
            mutation,
            variables: {
                revision: id
            },
            update: (cache, result) => {
                const content = result.data?.content;
                if (!content || !content.data || content.error) {
                    return;
                }
                GQLCache.unpublishPreviouslyPublishedRevision(model, cache, id);
            }
        });

        if (!response.data) {
            const error: CmsErrorResponse = {
                message: "Missing response data on Publish Entry Mutation.",
                code: "MISSING_RESPONSE_DATA",
                data: {}
            };
            return {
                error
            };
        }
        const { data, error } = response.data.content;
        if (error) {
            return {
                error
            };
        }

        return {
            entry: data,
            error: null
        };
    };

    useEffect(() => {
        return onEntryRevisionPublish(next => async params => {
            const result = await next(params);

            if (result.error) {
                return result;
            }

            const response = await handleOnPublish(params);

            return {
                ...result,
                ...response
            };
        });
    }, []);

    return null;
};

export const DefaultOnEntryPublish = React.memo(OnEntryPublish);
