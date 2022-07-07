import React, { useCallback, useEffect, useState } from "react";
import get from "lodash/get";
import { useNavigate } from "@webiny/react-router";
import { i18n } from "@webiny/app/i18n";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin";
import { ApwContentReviewContent, ApwContentTypes } from "~/types";
import {
    CREATE_CONTENT_REVIEW_MUTATION,
    CreateContentReviewMutationResponse,
    CreateApwContentReviewMutationVariables
} from "~/graphql/contentReview.gql";
import { IS_REVIEW_REQUIRED_QUERY } from "../graphql";
import { routePaths } from "~/utils";
import { useCms } from "@webiny/app-headless-cms/admin/hooks";
import { useApolloClient } from "@apollo/react-hooks";

const t = i18n.ns("app-apw/cms/dialog");

type CreateContentReviewInput = Pick<ApwContentReviewContent, "id" | "type">;

export const ApwOnEntryPublish: React.FC = () => {
    const { onEntryRevisionPublish } = useCms();
    const client = useApolloClient();
    const [input, setInput] = useState<CreateContentReviewInput | null>(null);
    const { showSnackbar } = useSnackbar();
    const navigate = useNavigate();

    const { showConfirmation: showRequestReviewConfirmation } = useConfirmationDialog({
        title: t`Request review`,
        message: (
            <p>
                {t`This content requires peer review approval before it can be published.
                {separator}
                 Do you wish to request a review?`({ separator: <br /> })}
            </p>
        )
    });

    const resetShowReview = () => setInput(null);

    const handleRequestReview = useCallback(async () => {
        if (!input) {
            return;
        }

        const response = await client.mutate<
            CreateContentReviewMutationResponse,
            CreateApwContentReviewMutationVariables
        >({
            mutation: CREATE_CONTENT_REVIEW_MUTATION,
            variables: {
                data: {
                    content: input
                }
            }
        });
        const error = response.data && response.data.apw.contentReview.error;
        const contentReview = response.data && response.data.apw.contentReview.data;

        if (error) {
            showSnackbar(error.message);
        } else if (contentReview) {
            showSnackbar(`Content review requested successfully!`);
            /**
             * Redirect to newly created "content review".
             */
            navigate(routePaths.CONTENT_REVIEWS + "/" + encodeURIComponent(contentReview.id));
        } else {
            showSnackbar(`Something went wrong!`);
        }

        resetShowReview();
    }, [input]);

    useEffect(() => {
        return onEntryRevisionPublish(next => async params => {
            const { id, entry, client } = params;
            const inputData = {
                id: id || entry.id,
                type: ApwContentTypes.CMS_ENTRY,
                settings: {
                    modelId: params.model.modelId
                }
            };
            const { data } = await client.query({
                query: IS_REVIEW_REQUIRED_QUERY,
                variables: {
                    data: inputData
                }
            });
            const contentReviewId = get(data, "apw.isReviewRequired.data.contentReviewId");
            if (contentReviewId) {
                showSnackbar(`A peer review for this content has been already requested.`);
                return next({
                    ...params,
                    error: {
                        message: `A peer review for this content has been already requested.`,
                        code: "PEER_REVIEW_REQUESTED",
                        data: {}
                    }
                });
            }

            const isReviewRequired = get(data, "apw.isReviewRequired.data.isReviewRequired");
            if (isReviewRequired) {
                setInput(inputData);
                return next({
                    ...params,
                    error: {
                        message: `A peer review is required.`,
                        code: "PEER_REVIEW_REQUIRED",
                        data: {}
                    }
                });
            }

            return next(params);
        });
    }, []);

    useEffect(() => {
        if (!input) {
            return;
        }
        showRequestReviewConfirmation(handleRequestReview, resetShowReview);
    }, [input]);

    return null;
};
