import React, { useEffect } from "react";
import get from "lodash/get";
import { i18n } from "@webiny/app/i18n";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin";
import {
    DELETE_CONTENT_REVIEW_MUTATION,
    DeleteApwContentReviewMutationVariables,
    DeleteApwContentReviewMutationResponse
} from "~/graphql/contentReview.gql";
import { ApwContentTypes } from "~/types";
import { IS_REVIEW_REQUIRED_QUERY } from "../graphql";
import { useCms } from "@webiny/app-headless-cms/admin/hooks";
import { FetchResult } from "apollo-link";

const t = i18n.ns("app-apw/cms/dialog");

export const ApwOnEntryDelete: React.FC = () => {
    const { onEntryDelete } = useCms();
    const { showSnackbar } = useSnackbar();

    const { showConfirmation: showDeleteReviewConfirmation } = useConfirmationDialog({
        title: t`Delete review`,
        message: (
            <p>
                {t`Before deleting the CMS Entry you first need to delete the ongoing review.
                {separator}
                 Do you wish to continue and delete the review?`({ separator: <br /> })}
            </p>
        )
    });

    useEffect(() => {
        return onEntryDelete(next => async params => {
            const { entry, client } = params;
            const input = {
                id: entry.id,
                type: ApwContentTypes.CMS_ENTRY,
                settings: {
                    modelId: params.model.modelId
                }
            };
            const { data } = await client.query({
                query: IS_REVIEW_REQUIRED_QUERY,
                variables: {
                    data: input
                },
                fetchPolicy: "network-only"
            });
            const contentReviewId = get(data, "apw.isReviewRequired.data.contentReviewId");
            const error = get(data, "apw.isReviewRequired.error", null);
            if (error) {
                // showSnackbar(error.message);
                return next({ ...params, error });
            } else if (contentReviewId) {
                const response = await new Promise<
                    FetchResult<DeleteApwContentReviewMutationResponse>
                >(resolve => {
                    showDeleteReviewConfirmation(async () => {
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

                const error = get(response, "data.apw.deleteContentReview.error");
                if (error) {
                    showSnackbar(error.message);
                    return next({ ...params, error });
                }
                showSnackbar(`Content review deleted successfully!`);
            }
            return next(params);
        });
    }, []);

    return null;
};
