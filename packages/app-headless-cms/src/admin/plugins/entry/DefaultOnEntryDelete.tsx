import React, { useEffect, useRef } from "react";
import { useCms } from "~/admin/hooks";
import { CmsEditorContentEntry, CmsModel } from "~/types";
import { createDeleteMutation } from "~/admin/graphql/contentEntries";
import { DocumentNode } from "graphql";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";

interface Mutations {
    [key: string]: DocumentNode;
}

interface CreateMutationKeyParams {
    model: CmsModel;
    locale: string;
}

interface HandleOnDeleteParams {
    model: CmsModel;
    entry: CmsEditorContentEntry;
}

const createMutationKey = (params: CreateMutationKeyParams): string => {
    const { model, locale } = params;
    return `${model.modelId}_${locale}_${model.savedOn}`;
};

const OnEntryDelete: React.FC = () => {
    const { getCurrentLocale } = useI18N();
    const { onEntryDelete, getApolloClient } = useCms();

    const mutations = useRef<Mutations>({});

    const getMutation = (model: CmsModel, locale: string) => {
        const key = createMutationKey({ model, locale });
        if (!mutations.current[key]) {
            mutations.current[key] = createDeleteMutation(model);
        }
        return mutations.current[key];
    };

    const handleOnDelete = async ({ model, entry }: HandleOnDeleteParams) => {
        const locale = getCurrentLocale();
        if (!locale) {
            return {
                error: {
                    message: "Missing locale."
                }
            };
        }
        const client = getApolloClient(locale);
        const mutation = getMutation(model, locale);

        const response = await client.mutate({
            mutation,
            variables: {
                revision: entry.id
            }
        });

        if (!response.data) {
            return {
                cache: client.cache,
                error: {
                    message: "Missing response data on Delete Entry Mutation."
                }
            };
        }
        const { error } = response.data.content;
        if (error) {
            return {
                cache: client.cache,
                error
            };
        }
        return {
            cache: client.cache,
            data: true,
            error: null
        };
    };

    useEffect(() => {
        return onEntryDelete(next => async params => {
            const result = await next(params);

            const response = await handleOnDelete({
                ...params
            });
            return {
                ...result,
                ...(response || {})
            };
        });
    }, []);

    return null;
};

export const DefaultOnEntryDelete = React.memo(OnEntryDelete);
