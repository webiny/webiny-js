import { useApolloClient, useMutation } from "@apollo/react-hooks";
import { useCallback, useEffect, useReducer } from "react";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import * as GQL from "../../../../graphql";
import { FetchPolicy } from "apollo-client";

export default form => {
    const [state, setState] = useReducer((prev, next) => ({ ...prev, ...next }), {
        loading: false,
        page: 0,
        cursors: {
            0: null
        },
        exportInProgress: false,
        submissions: [],
        sort: ["createdOn_DESC"]
    });

    const client = useApolloClient();

    const { showSnackbar } = useSnackbar();

    const loadSubmissions = async (fetchPolicy: FetchPolicy = "cache-first") => {
        setState({ loading: true });

        const { data: res } = await client.query({
            query: GQL.LIST_FORM_SUBMISSIONS,
            variables: { form: form.id, sort: state.sort, after: state.cursors[state.page] },
            fetchPolicy
        });

        const { data, meta } = res.formBuilder.listFormSubmissions;

        setState({
            loading: false,
            submissions: data,
            cursors: {
                ...state.cursors,
                // Store cursor to load next page
                [state.page + 1]: meta.hasMoreItems ? meta.cursor : undefined
            }
        });
    };

    useEffect(() => {
        loadSubmissions();
    }, [form.id, state.page, state.sort]);

    const [exportFormSubmission] = useMutation(GQL.EXPORT_FORM_SUBMISSIONS);
    const exportSubmissions = useCallback(async () => {
        setState({ exportInProgress: true });
        const { data } = await exportFormSubmission({
            variables: {
                form: form.id
            }
        });
        setState({ exportInProgress: false });

        const { data: csvFile, error } = data.formBuilder.exportFormSubmissions;
        if (error) {
            showSnackbar(error.message);
            return;
        }

        window.open(csvFile.src, "_blank");
    }, [form]);

    const hasPreviousPage = state.page > 0;
    const hasNextPage = typeof state.cursors[state.page + 1] === "string";

    return {
        loading: state.loading,
        refresh: () => loadSubmissions("network-only"),
        submissions: state.submissions,
        setSorter: (sort: any) => {
            setState({ sort });
        },
        hasPreviousPage,
        hasNextPage,
        nextPage: () => {
            if (!hasNextPage) {
                return;
            }
            setState({ page: state.page + 1 });
        },
        previousPage: () => {
            if (!hasPreviousPage) {
                return;
            }
            setState({ page: state.page - 1 });
        },
        exportSubmissions,
        exportInProgress: state.exportInProgress
    };
};
