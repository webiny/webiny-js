import { useMutation, useQuery } from "@apollo/react-hooks";
import { useCallback, useReducer } from "react";
import debounce from "lodash/debounce";
import get from "lodash/get";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { FbFormModel } from "~/types";
import {
    ExportFormSubmissionsMutationResponse,
    ExportFormSubmissionsMutationVariables,
    EXPORT_FORM_SUBMISSIONS,
    LIST_FORM_SUBMISSIONS
} from "~/admin/graphql";

interface State {
    loading: boolean;
    exportInProgress: boolean;
    sort: string[];
}
interface Reducer {
    (prev: State, next: Partial<State>): State;
}

export const useSubmissions = (form: Pick<FbFormModel, "id">) => {
    const [state, setState] = useReducer<Reducer>((prev, next) => ({ ...prev, ...next }), {
        loading: false,
        exportInProgress: false,
        sort: ["createdOn_DESC"]
    });

    const { showSnackbar } = useSnackbar();

    const listQuery = useQuery(LIST_FORM_SUBMISSIONS, {
        variables: { form: form.id, sort: state.sort, limit: 20 }
    });

    const loadMoreOnScroll = useCallback(
        debounce(scrollFrame => {
            if (!state.loading && scrollFrame.top > 0.9) {
                const meta = get(listQuery, "data.formBuilder.listFormSubmissions.meta", {});
                if (meta.cursor) {
                    setState({ loading: true });
                    listQuery.fetchMore({
                        variables: { after: meta.cursor, limit: 10 },
                        updateQuery: (prev: any, { fetchMoreResult }: any) => {
                            if (!fetchMoreResult) {
                                return prev;
                            }

                            const next = { ...fetchMoreResult };

                            next.formBuilder.listFormSubmissions.data = [
                                ...prev.formBuilder.listFormSubmissions.data,
                                ...fetchMoreResult.formBuilder.listFormSubmissions.data
                            ];
                            setState({
                                loading: false
                            });
                            return next;
                        }
                    });
                }
            }
        }, 500),
        [listQuery]
    );

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
        loading: [listQuery].some(item => item.loading),
        fetchMoreLoading: state.loading,
        refresh: () => {
            if (!listQuery.refetch) {
                return;
            }
            listQuery.refetch();
        },
        loadMoreOnScroll,
        submissions: get(listQuery, "data.formBuilder.listFormSubmissions.data", []),
        setSorter: (sort: string[]) => {
            setState({ sort });
        },
        exportSubmissions,
        exportInProgress: state.exportInProgress
    };
};
