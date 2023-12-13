import React, { useCallback, useEffect } from "react";
import dotPropImmutable from "dot-prop-immutable";
import { useNavigate } from "@webiny/react-router";
import { i18n } from "@webiny/app/i18n";
import { ShowConfirmationOnAccept, useConfirmationDialog, useSnackbar } from "@webiny/app-admin";
import { ApwContentReviewContent, ApwContentTypes } from "~/types";
import {
    CREATE_CONTENT_REVIEW_MUTATION,
    CreateApwContentReviewMutationVariables,
    CreateContentReviewMutationResponse
} from "~/graphql/contentReview.gql";
import { IS_REVIEW_REQUIRED_QUERY } from "../graphql";
import { routePaths } from "~/utils";
import { useCms } from "@webiny/app-headless-cms/admin/hooks";
import { useApolloClient } from "@apollo/react-hooks";

const t = i18n.ns("app-apw/cms/dialog");

interface Resolve {
    (): void;
}

type CreateContentReviewInput = Pick<ApwContentReviewContent, "id" | "type">;

export const ApwOnEntryPublish = () => {
    const { onEntryRevisionPublish } = useCms();
    const client = useApolloClient();
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

    const handleRequestReview = useCallback(
        (resolve: Resolve, input: CreateContentReviewInput): ShowConfirmationOnAccept => {
            return async () => {
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
                    resolve();
                    return;
                } else if (contentReview) {
                    showSnackbar(`Content review requested successfully!`);
                    /**
                     * Redirect to newly created "content review".
                     */
                    resolve();
                    navigate(
                        routePaths.CONTENT_REVIEWS + "/" + encodeURIComponent(contentReview.id)
                    );
                    return;
                }

                showSnackbar(`Something went wrong!`);
                resolve();
            };
        },
        []
    );

    useEffect(() => {
        return onEntryRevisionPublish(next => async params => {
            const { id, entry } = params;
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
            const contentReviewId = dotPropImmutable.get(
                data,
                "apw.isReviewRequired.data.contentReviewId"
            );
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

            const isReviewRequired = dotPropImmutable.get(
                data,
                "apw.isReviewRequired.data.isReviewRequired"
            );
            if (!isReviewRequired) {
                return next(params);
            }
            /**
             * We need to show a confirmation dialog with a promise and a resolver
             * because of the async nature of the dialog confirmation action.
             *
             * If there was no promise and resolver, the next function would be triggered immediately and the dialog would not show.
             */
            return await new Promise((resolve: any) => {
                showRequestReviewConfirmation(handleRequestReview(resolve, inputData), resolve);
            }).then(() => {
                return next({
                    ...params,
                    error: {
                        message: `A peer review is required.`,
                        code: "PEER_REVIEW_REQUIRED",
                        data: {}
                    }
                });
            });
        });
    }, []);

    return null;
};
