import { useCallback, useState } from "react";
import { useRouter } from "@webiny/react-router";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { LIST_TARGET_DATA_MODELS, DELETE_TARGET_DATA_MODEL } from "./graphql";

interface useTargetDataModelsDataListHook {
    (): {
        loading: boolean;
        targetDataModels: Array<{
            id: string;
            title: string;
            description: string;
            createdOn: string;
            [key: string]: any;
        }>;
        currentTargetDataModelId: string;
        sort: string;
        setSort: (sort: string) => void;
        newTargetDataModel: () => void;
        editTargetDataModel: (id: string) => void;
        deleteTargetDataModel: (id: string) => void;
    };
}

export const useTargetDataModelsDataList: useTargetDataModelsDataListHook = () => {
    const [sort, setSort] = useState<string>();
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const listQuery = useQuery(LIST_TARGET_DATA_MODELS, { variables: { sort } });
    const searchParams = new URLSearchParams(location.search);
    const currentTargetDataModelId = searchParams.get("id");
    const [deleteIt, deleteMutation] = useMutation(DELETE_TARGET_DATA_MODEL, {
        refetchQueries: [{ query: LIST_TARGET_DATA_MODELS }]
    });

    const { showConfirmation } = useConfirmationDialog();

    const targetDataModels = listQuery.loading
        ? []
        : listQuery.data.targetDataModels.listTargetDataModels.data;

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

    const loading = [listQuery, deleteMutation].some(item => item.loading);
    const newTargetDataModel = useCallback(() => history.push("/target-data-models?new"), []);
    const editTargetDataModel = useCallback(id => {
        history.push(`/target-data-models?id=${id}`);
    }, []);

    return {
        targetDataModels,
        loading,
        currentTargetDataModelId,
        sort,
        setSort,
        newTargetDataModel,
        editTargetDataModel,
        deleteTargetDataModel
    };
};
