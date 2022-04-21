import { useState } from "react";
import { useMutation } from "@apollo/react-hooks";
import get from "lodash/get";
import { useContentReviewId, useCurrentStepId } from "~/hooks/useContentReviewId";
import { useSnackbar } from "@webiny/app-admin";
import { GET_CHANGE_REQUEST_QUERY } from "~/graphql/changeRequest.gql";
import { useActiveChangeRequestId } from "~/hooks/useCurrentChangeRequestId";
import {
    GET_CONTENT_REVIEW_QUERY,
    PROVIDE_SIGN_OFF_MUTATION,
    ProvideSignOffMutationResponse,
    ProvideSignOffMutationVariables,
    RETRACT_SIGN_OFF_MUTATION,
    RetractSignOffMutationResponse,
    RetractSignOffMutationVariables
} from "~/graphql/contentReview.gql";

interface UseStepSignOffResult {
    provideSignOff: Function;
    retractSignOff: Function;
    loading: boolean;
}

export const useStepSignOff = (): UseStepSignOffResult => {
    const [loading, setLoading] = useState<boolean>(false);
    const { id: stepId } = useCurrentStepId();
    const { id } = useContentReviewId() || { id: "" };
    const { showSnackbar } = useSnackbar();
    const changeRequestId = useActiveChangeRequestId();

    const [provideSignOff] = useMutation<
        ProvideSignOffMutationResponse,
        ProvideSignOffMutationVariables
    >(PROVIDE_SIGN_OFF_MUTATION, {
        refetchQueries: [
            {
                query: GET_CHANGE_REQUEST_QUERY,
                variables: { id: changeRequestId }
            },
            {
                query: GET_CONTENT_REVIEW_QUERY,
                variables: {
                    id
                }
            }
        ],
        onCompleted: response => {
            const error = get(response, "apw.provideSignOff.error");
            if (error) {
                showSnackbar(error.message);
                return;
            }
            showSnackbar("Sign off provided successfully!");
        },
        /*
         * We want to wait for "GET_CONTENT_REVIEW_QUERY" because we rely on it for sign-off provided status of a step.
         */
        awaitRefetchQueries: true
    });
    const [retractSignOff] = useMutation<
        RetractSignOffMutationResponse,
        RetractSignOffMutationVariables
    >(RETRACT_SIGN_OFF_MUTATION, {
        refetchQueries: [
            {
                query: GET_CHANGE_REQUEST_QUERY,
                variables: { id: changeRequestId }
            },
            {
                query: GET_CONTENT_REVIEW_QUERY,
                variables: {
                    id
                }
            }
        ],
        onCompleted: response => {
            const error = get(response, "apw.retractSignOff.error");
            if (error) {
                showSnackbar(error.message);
                return;
            }
            showSnackbar("Sign off retracted successfully!");
        },
        /*
         * We want to wait for "GET_CONTENT_REVIEW_QUERY" because we rely on it for sign-off provided status of a step.
         */
        awaitRefetchQueries: true
    });

    return {
        provideSignOff: async () => {
            setLoading(true);
            await provideSignOff({ variables: { id, step: stepId } });
            setLoading(false);
        },
        retractSignOff: async () => {
            setLoading(true);
            await retractSignOff({ variables: { id, step: stepId } });
            setLoading(false);
        },
        loading
    };
};
