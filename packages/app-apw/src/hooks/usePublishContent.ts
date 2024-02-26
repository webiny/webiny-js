import { useState } from "react";
import { useMutation } from "@apollo/react-hooks";
import dotPropImmutable from "dot-prop-immutable";
import {
    DELETE_SCHEDULED_ACTION_MUTATION,
    DeleteApwContentReviewMutationResponse,
    DeleteApwContentReviewMutationVariables,
    GET_CONTENT_REVIEW_QUERY,
    PUBLISH_CONTENT_MUTATION,
    PublishContentMutationResponse,
    PublishContentMutationVariables,
    UNPUBLISH_CONTENT_MUTATION,
    UnPublishContentMutationResponse,
    UnPublishContentMutationVariables
} from "~/graphql/contentReview.gql";
import { useContentReviewId } from "~/hooks/useContentReviewId";
import { useSnackbar } from "@webiny/app-admin";

interface UsePublishContentResult {
    publishContent: (datetime?: string) => Promise<void>;
    unpublishContent: (datetime?: string) => Promise<void>;
    deleteScheduledAction: () => void;
    loading: boolean;
}

export const usePublishContent = (): UsePublishContentResult => {
    const [loading, setLoading] = useState<boolean>(false);
    const { id } = useContentReviewId() || { id: "" };
    const { showSnackbar } = useSnackbar();

    const [publishContent] = useMutation<
        PublishContentMutationResponse,
        PublishContentMutationVariables
    >(PUBLISH_CONTENT_MUTATION, {
        refetchQueries: [
            {
                query: GET_CONTENT_REVIEW_QUERY,
                variables: {
                    id
                }
            }
        ],
        onCompleted: response => {
            const error = dotPropImmutable.get(response, "apw.publishContent.error");
            if (error) {
                showSnackbar(error.message);
                return;
            }
            showSnackbar("Content published successfully!");
        }
    });

    const [unpublishContent] = useMutation<
        UnPublishContentMutationResponse,
        UnPublishContentMutationVariables
    >(UNPUBLISH_CONTENT_MUTATION, {
        refetchQueries: [
            {
                query: GET_CONTENT_REVIEW_QUERY,
                variables: {
                    id
                }
            }
        ],
        onCompleted: response => {
            const error = dotPropImmutable.get(response, "apw.unpublishContent.error");
            if (error) {
                showSnackbar(error.message);
                return;
            }
            showSnackbar("Content unpublished successfully!");
        }
    });

    const [deleteScheduledAction] = useMutation<
        DeleteApwContentReviewMutationResponse,
        DeleteApwContentReviewMutationVariables
    >(DELETE_SCHEDULED_ACTION_MUTATION, {
        refetchQueries: [
            {
                query: GET_CONTENT_REVIEW_QUERY,
                variables: {
                    id
                }
            }
        ],
        onCompleted: response => {
            const error = dotPropImmutable.get(response, "apw.deleteScheduledAction.error");
            if (error) {
                showSnackbar(error.message);
                return;
            }
            showSnackbar("Unset scheduled action successfully!");
        }
    });

    return {
        publishContent: async (datetime?: string) => {
            setLoading(true);
            await publishContent({ variables: { id, datetime } });
            setLoading(false);
        },
        unpublishContent: async (datetime?: string) => {
            setLoading(true);
            await unpublishContent({ variables: { id, datetime } });
            setLoading(false);
        },
        deleteScheduledAction: async () => {
            setLoading(true);
            await deleteScheduledAction({ variables: { id } });
            setLoading(false);
        },
        loading
    };
};
