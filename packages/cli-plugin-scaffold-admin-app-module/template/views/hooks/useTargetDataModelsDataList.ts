import { useCallback, useReducer } from "react";
import { useRouter } from "@webiny/react-router";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { PaginationProp } from "@webiny/ui/List/DataList/types";
import { LIST_TARGET_DATA_MODELS, DELETE_TARGET_DATA_MODEL } from "./graphql";

/**
 * Contains essential data listing functionality - data querying and UI control.
 */

interface useTargetDataModelsDataListHook {
    (): {
        targetDataModels: Array<{
            id: string;
            title: string;
            description: string;
            createdOn: string;
            [key: string]: any;
        }>;
        loading: boolean;
        pagination: PaginationProp;
        refresh: () => void;
        setSort: (sort: string) => void;
        newTargetDataModel: () => void;
        editTargetDataModel: (id: string) => void;
        deleteTargetDataModel: (id: string) => void;
        currentTargetDataModelId: string | null;
    };
}

interface TargetDataModelsState {
    limit?: any;
    after?: any;
    before?: any;
    sort?: any;
}

const reducer = (
    prev: TargetDataModelsState,
    next: Partial<TargetDataModelsState>
): TargetDataModelsState => ({ ...prev, ...next });

export const useTargetDataModelsDataList: useTargetDataModelsDataListHook = () => {
    // Base state and UI React hooks.
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const { showConfirmation } = useConfirmationDialog();
    const [variables, setVariables] = useReducer(reducer, {
        limit: undefined,
        after: undefined,
        before: undefined,
        sort: undefined
    });

    const searchParams = new URLSearchParams(location.search);
    const currentTargetDataModelId = searchParams.get("id") || null;

    // Queries and mutations.
    const listQuery = useQuery(LIST_TARGET_DATA_MODELS, {
        variables,
        onError: e => showSnackbar(e.message)
    });

    const [deleteIt, deleteMutation] = useMutation(DELETE_TARGET_DATA_MODEL, {
        refetchQueries: [{ query: LIST_TARGET_DATA_MODELS }]
    });

    const { data: targetDataModels = [], meta = {} } = listQuery.loading
        ? {}
        : listQuery?.data?.targetDataModels?.listTargetDataModels || {};
    const loading = [listQuery, deleteMutation].some(item => item.loading);

    // Base CRUD actions - new, edit, and delete.
    const newTargetDataModel = useCallback(() => history.push("/target-data-models?new"), []);
    const editTargetDataModel = useCallback(id => {
        history.push(`/target-data-models?id=${id}`);
    }, []);

    const deleteTargetDataModel = useCallback(
        item => {
            showConfirmation(async () => {
                try {
                    await deleteIt({
                        variables: item
                    });

                    showSnackbar(`Target Data Model "${item.title}" deleted.`);
                    if (currentTargetDataModelId === item.id) {
                        history.push(`/target-data-models`);
                    }
                } catch (e) {
                    showSnackbar(e.message);
                }
            });
        },
        [currentTargetDataModelId]
    );

    // Sorting.
    const setSort = useCallback(
        value => setVariables({ after: undefined, before: undefined, sort: value }),
        []
    );

    // Pagination metadata and controls.
    const setPreviousPage = useCallback(
        () => setVariables({ after: undefined, before: meta.before }),
        []
    );
    const setNextPage = useCallback(
        () => setVariables({ after: meta.after, before: undefined }),
        []
    );
    const setLimit = useCallback(
        value => setVariables({ after: undefined, before: undefined, limit: value }),
        []
    );

    const pagination: PaginationProp = {
        setPerPage: setLimit,
        perPageOptions: [10, 25, 50],
        setPreviousPage,
        setNextPage,
        hasPreviousPage: meta.before,
        hasNextPage: meta.after
    };

    return {
        targetDataModels,
        loading,
        refresh: (): void => {
            listQuery.refetch();
        },
        pagination,
        setSort,
        newTargetDataModel,
        editTargetDataModel,
        deleteTargetDataModel,
        currentTargetDataModelId
    };
};
