import React from "react";
import dotPropImmutable from "dot-prop-immutable";
import { i18n } from "@webiny/app/i18n";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin";
import {
    DELETE_CONTENT_REVIEW_MUTATION,
    DeleteApwContentReviewMutationVariables,
    DeleteApwContentReviewMutationResponse
} from "~/graphql/contentReview.gql";
import { ApwContentTypes } from "~/types";
import { IS_REVIEW_REQUIRED_QUERY } from "../graphql";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms";
import { FetchResult } from "apollo-link";
import { useApolloClient } from "@apollo/react-hooks";

const t = i18n.ns("app-apw/cms/dialog");

const { ContentEntry } = ContentEntryEditorConfig;

export const ApwOnEntryDelete = ContentEntry.useContentEntry.createDecorator(baseHook => {
    return () => {
        const hook = baseHook();
        const client = useApolloClient();
        const { showSnackbar } = useSnackbar();

        const { showConfirmation } = useConfirmationDialog({
            title: t`Delete review`,
            message: (
                <p>
                    {t`Before deleting this entry, you must delete the ongoing review.
                {separator}
                 Do you wish to continue and delete the review?`({ separator: <br /> })}
                </p>
            )
        });

        return {
            ...hook,
            deleteEntry: async params => {
                const input = {
                    id: params.id,
                    type: ApwContentTypes.CMS_ENTRY,
                    settings: {
                        modelId: hook.contentModel.modelId
                    }
                };
                const { data } = await client.query({
                    query: IS_REVIEW_REQUIRED_QUERY,
                    variables: {
                        data: input
                    },
                    fetchPolicy: "network-only"
                });
                const contentReviewId = dotPropImmutable.get(
                    data,
                    "apw.isReviewRequired.data.contentReviewId"
                );
                const error = dotPropImmutable.get(data, "apw.isReviewRequired.error", null);
                if (error) {
                    showSnackbar(error.message);

                    return { error };
                }

                if (contentReviewId) {
                    const response = await new Promise<
                        FetchResult<DeleteApwContentReviewMutationResponse>
                    >(resolve => {
                        showConfirmation(async () => {
                            // TODO: create an SDK for APW
                            const response = await client.mutate<
                                DeleteApwContentReviewMutationResponse,
                                DeleteApwContentReviewMutationVariables
                            >({
                                mutation: DELETE_CONTENT_REVIEW_MUTATION,
                                variables: {
                                    id: contentReviewId
                                }
                            });

                            resolve(response);
                        });
                    });

                    const error = dotPropImmutable.get(
                        response,
                        "data.apw.deleteContentReview.error"
                    );

                    if (error) {
                        showSnackbar(error.message);
                        return { error };
                    }
                    showSnackbar(`Content review deleted successfully!`);
                }

                return hook.deleteEntry(params);
            }
        };
    };
});
