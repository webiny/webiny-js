import React, { useEffect } from "react";
import get from "lodash/get";
import { useApolloClient } from "@apollo/react-hooks";
import { i18n } from "@webiny/app/i18n";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin";
import { useAdminPageBuilder } from "@webiny/app-page-builder/admin/hooks/useAdminPageBuilder";
import { DELETE_CONTENT_REVIEW_MUTATION } from "~/graphql/contentReview.gql";
import { ApwContentTypes } from "~/types";
import { IS_REVIEW_REQUIRED_QUERY } from "../graphql";

const t = i18n.ns("app-apw/page-builder/dialog");

export const ApwOnPageDelete: React.FC = () => {
    const pageBuilder = useAdminPageBuilder();
    const client = useApolloClient();
    const { showSnackbar } = useSnackbar();

    const { showConfirmation: showDeleteReviewConfirmation } = useConfirmationDialog({
        title: t`Delete review`,
        message: (
            <p>
                {t`Before deleting the page you first need to delete the ongoing review.
                {separator}
                 Do you wish to continue and delete the review?`({ separator: <br /> })}
            </p>
        )
    });

    useEffect(() => {
        return pageBuilder.onPageDelete(next => async params => {
            const { page } = params;
            const input = {
                id: page.id,
                type: ApwContentTypes.PAGE
            };
            const { data } = await client.query({
                query: IS_REVIEW_REQUIRED_QUERY,
                variables: {
                    data: input
                },
                fetchPolicy: "network-only"
            });
            const contentReviewId = get(data, "apw.isReviewRequired.data.contentReviewId");
            if (contentReviewId) {
                const response = await new Promise(resolve => {
                    showDeleteReviewConfirmation(async () => {
                        const response = await client.mutate({
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
                } else {
                    showSnackbar(`Content review deleted successfully!`);
                    return next(params);
                }
            } else {
                return next(params);
            }
        });
    }, []);

    return null;
};
