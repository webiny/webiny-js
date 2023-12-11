import React, { useEffect, useRef } from "react";
import { useCms } from "~/admin/hooks";
import { CmsErrorResponse, CmsModel } from "~/types";
import {
    CmsEntryUnpublishMutationResponse,
    CmsEntryUnpublishMutationVariables,
    createUnpublishMutation
} from "@webiny/app-headless-cms-common";
import { DocumentNode } from "graphql";
import { OnEntryUnpublishRequest } from "~/admin/contexts/Cms";

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

const OnEntryUnpublish = () => {
    const { onEntryRevisionUnpublish } = useCms();

    const mutations = useRef<Mutations>({});

    const getMutation = (model: CmsModel, locale: string) => {
        const key = createMutationKey({ model, locale });
        if (!mutations.current[key]) {
            mutations.current[key] = createUnpublishMutation(model);
        }
        return mutations.current[key];
    };

    const handleOnUnpublish = async ({ model, id, client, locale }: OnEntryUnpublishRequest) => {
        const mutation = getMutation(model, locale);

        const response = await client.mutate<
            CmsEntryUnpublishMutationResponse,
            CmsEntryUnpublishMutationVariables
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
        return onEntryRevisionUnpublish(next => async params => {
            const result = await next(params);

            if (result.error) {
                return result;
            }

            const response = await handleOnUnpublish({
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

export const DefaultOnEntryUnpublish = React.memo(OnEntryUnpublish);
