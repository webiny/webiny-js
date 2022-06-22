import React, { useCallback, useEffect, useRef } from "react";
import { DocumentNode } from "graphql";
import {
    CmsEntryPublishMutationResponse,
    CmsEntryPublishMutationVariables,
    createPublishMutation
} from "~/admin/graphql/contentEntries";
import { CmsErrorResponse, CmsModel } from "~/types";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
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
    const { getCurrentLocale } = useI18N();
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

    const handleOnPublish = async ({ model, client, id }: OnEntryPublishResponse) => {
        const locale = getCurrentLocale();
        if (!locale) {
            const error: CmsErrorResponse = {
                message: "Missing locale.",
                code: "MISSING_LOCALE",
                data: {}
            };
            return {
                error
            };
        }
        const mutation = getMutation(model, locale);

        const response = await client.mutate<
            CmsEntryPublishMutationResponse,
            CmsEntryPublishMutationVariables
        >({
            mutation,
            variables: {
                revision: id
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
        const { error } = response.data.content;
        if (error) {
            return {
                error
            };
        }

        GQLCache.unpublishPreviouslyPublishedRevision(model, client.cache, id);

        return {
            data: true,
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
