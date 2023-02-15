import { useApolloClient, useMutation } from "@apollo/react-hooks";
import { useCallback, useEffect, useReducer } from "react";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { FetchPolicy } from "apollo-client";
import { FbFormModel, FbFormSubmissionData } from "~/types";
import {
    ExportFormSubmissionsMutationResponse,
    ExportFormSubmissionsMutationVariables,
    EXPORT_FORM_SUBMISSIONS,
    ListFormSubmissionsQueryResponse,
    ListFormSubmissionsQueryVariables,
    LIST_FORM_SUBMISSIONS
} from "~/admin/graphql";

interface State {
    loading: boolean;
    exportInProgress: boolean;
    submissions: FbFormSubmissionData[];
    sort: string[];
}
interface Reducer {
    (prev: State, next: Partial<State>): State;
}

export const useSubmissions = (form: Pick<FbFormModel, "id">) => {
    const [state, setState] = useReducer<Reducer>((prev, next) => ({ ...prev, ...next }), {
        loading: false,
        exportInProgress: false,
        submissions: [],
        sort: ["createdOn_DESC"]
    });

    const client = useApolloClient();

    const { showSnackbar } = useSnackbar();

    const loadSubmissions = async (fetchPolicy: FetchPolicy = "cache-first") => {
        setState({ loading: true });

        const { data: res } = await client.query<
            ListFormSubmissionsQueryResponse,
            ListFormSubmissionsQueryVariables
        >({
            query: LIST_FORM_SUBMISSIONS,
            variables: { form: form.id, sort: state.sort },
            fetchPolicy
        });

        const { data } = res.formBuilder.listFormSubmissions;

        setState({
            loading: false,
            submissions: data
        });
    };

    useEffect((): void => {
        loadSubmissions();
    }, [form.id, state.sort]);

    const [exportFormSubmission] = useMutation<
        ExportFormSubmissionsMutationResponse,
        ExportFormSubmissionsMutationVariables
    >(EXPORT_FORM_SUBMISSIONS);
    const exportSubmissions = useCallback(async (): Promise<void> => {
        setState({ exportInProgress: true });
        const { data } = await exportFormSubmission({
            variables: {
                form: form.id
            }
        });
        setState({ exportInProgress: false });

        if (!data) {
            showSnackbar("Missing response data on Export Form Submissions.");
            return;
        }

        const { data: csvFile, error } = data.formBuilder.exportFormSubmissions;
        if (error) {
            showSnackbar(error.message);
            return;
        }

        window.open(csvFile.src, "_blank");
    }, [form]);

    return {
        loading: state.loading,
        refresh: () => loadSubmissions("network-only"),
        submissions: state.submissions,
        setSorter: (sort: string[]) => {
            setState({ sort });
        },
        exportSubmissions,
        exportInProgress: state.exportInProgress
    };
};
