import { useState } from "react";
import { useMutation } from "@apollo/react-hooks";
import get from "lodash/get";
import { PUBLISH_CONTENT_MUTATION } from "../graphql/provideSignoff";
import { useContentReviewId } from "~/admin/hooks/useContentReviewId";
import { useSnackbar } from "@webiny/app-admin";
import { GET_CONTENT_REVIEW_QUERY } from "~/admin/views/contentReviewDashboard/hooks/graphql";

interface UsePublishContentResult {
    publishContent: Function;
    loading: boolean;
}

export const usePublishContent = (): UsePublishContentResult => {
    const [loading, setLoading] = useState<boolean>(false);
    const { id } = useContentReviewId();
    const { showSnackbar } = useSnackbar();

    const [publishContent] = useMutation(PUBLISH_CONTENT_MUTATION, {
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

    return {
        publishContent: async () => {
            setLoading(true);
            await publishContent({ variables: { id } });
            setLoading(false);
        },
        loading
    };
};
