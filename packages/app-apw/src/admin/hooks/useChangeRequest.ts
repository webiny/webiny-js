// import { useCallback, useState } from "react";
import get from "lodash/get";
// import { useRouter } from "@webiny/react-router";
import { useQuery, useMutation } from "@apollo/react-hooks";
import {
    CREATE_CHANGE_REQUEST_MUTATION,
    GET_CHANGE_REQUEST_QUERY,
    LIST_CHANGE_REQUESTS_QUERY,
    DELETE_CHANGE_REQUEST_MUTATION
} from "../graphql/changeRequest.gql";
import { useSnackbar } from "@webiny/app-admin";
import { useRouter } from "@webiny/react-router";
import { useContentReviewId, useCurrentStepId } from "~/admin/hooks/useContentReviewId";

interface UseChangeRequestParams {
    id?: string;
}

interface UseChangeRequestResult {
    create: Function;
    deleteChangeRequest: ({ variables: { id: string } }) => void;
}

export const useChangeRequest = ({ id }: UseChangeRequestParams): UseChangeRequestResult => {
    const { showSnackbar } = useSnackbar();
    const { history } = useRouter();
    const { stepId } = useCurrentStepId();
    const { encodedId } = useContentReviewId();

    const { data } = useQuery(GET_CHANGE_REQUEST_QUERY, {
        variables: { id },
        skip: !id,
        onCompleted: response => {
            const error = get(response, "apw.changeRequest.error");
            if (error) {
                showSnackbar(error.message);
                history.push(`/apw/content-reviews/${encodedId}?stepId=${stepId}`);
            }
        }
    });
    console.log(JSON.stringify({ data }, null, 2));

    const [create] = useMutation(CREATE_CHANGE_REQUEST_MUTATION, {
        refetchQueries: [{ query: LIST_CHANGE_REQUESTS_QUERY }],
        onCompleted: response => {
            const error = get(response, "apw.changeRequest.error");
            if (error) {
                showSnackbar(error.message);
                return;
            }
            showSnackbar("Change request created successfully!");
        }
    });

    const [deleteChangeRequest] = useMutation(DELETE_CHANGE_REQUEST_MUTATION, {
        refetchQueries: [{ query: LIST_CHANGE_REQUESTS_QUERY }],
        onCompleted: response => {
            const error = get(response, "apw.deleteChangeRequest.error");
            if (error) {
                showSnackbar(error.message);
                return;
            }
            showSnackbar("Change request deleted successfully!");
        }
    });

    return {
        create,
        deleteChangeRequest
    };
};
