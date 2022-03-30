import { useState } from "react";
import { useMutation } from "@apollo/react-hooks";
import get from "lodash/get";
import {
    PUBLISH_CONTENT_MUTATION,
    UNPUBLISH_CONTENT_MUTATION,
    DELETE_SCHEDULED_ACTION_MUTATION,
    PublishContentMutationResponse,
    PublishContentMutationVariables,
    UnPublishContentMutationResponse,
    UnPublishContentMutationVariables,
    DeleteContentReviewMutationResponse,
    DeleteApwContentReviewMutationVariables
} from "~/graphql/contentReview.gql";
import { useContentReviewId } from "~/hooks/useContentReviewId";
import { useSnackbar } from "@webiny/app-admin";
import { GET_CONTENT_REVIEW_QUERY } from "~/graphql/contentReview.gql";

interface UsePublishContentResult {
    publishContent: Function;
    unpublishContent: Function;
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
            const error = get(response, "apw.publishContent.error");
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
            const error = get(response, "apw.unpublishContent.error");
            if (error) {
                showSnackbar(error.message);
                return;
            }
            showSnackbar("Content unpublished successfully!");
        }
    });

    const [deleteScheduledAction] = useMutation<
        DeleteContentReviewMutationResponse,
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
            const error = get(response, "apw.deleteScheduledAction.error");
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
