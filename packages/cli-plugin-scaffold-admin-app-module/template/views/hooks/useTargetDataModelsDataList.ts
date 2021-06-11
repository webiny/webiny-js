import { useCallback, useState } from "react";
import orderBy from "lodash/orderBy";
import { useRouter } from "@webiny/react-router";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { LIST_TARGET_DATA_MODELS, DELETE_TARGET_DATA_MODEL } from "./graphql";

interface Config {
    sorters: { label: string; value: string }[];
}

interface useTargetDataModelsDataListHook {
    (config: Config): {
        loading: boolean;
        targetDataModels: Array<{
            id: string;
            title: string;
            description: string;
            createdOn: string;
            [key: string]: any;
        }>;
        currentTargetDataModelId: string;
        currentTargetDataModel: () => void;
        filter: string;
        setFilter: (filter: string) => void;
        sort: string;
        setSort: (sort: string) => void;
        editTargetDataModel: (id: string) => void;
        deleteTargetDataModel: (id: string) => void;
    };
}

export const useTargetDataModelsDataList: useTargetDataModelsDataListHook = (config: Config) => {
    const defaultSorter = config.sorters.length ? config.sorters[0].value : null;
    const [filter, setFilter] = useState<string>("");
    const [sort, setSort] = useState<string>((defaultSorter));
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const listQuery = useQuery(LIST_TARGET_DATA_MODELS);
    const searchParams = new URLSearchParams(location.search);
    const currentTargetDataModelId = searchParams.get("id");
    const [deleteIt, deleteMutation] = useMutation(DELETE_TARGET_DATA_MODEL, {
        refetchQueries: [{ query: LIST_TARGET_DATA_MODELS }]
    });

    const { showConfirmation } = useConfirmationDialog();

    const sortTargetDataModelsList = useCallback(
        targetDataModels => {
            if (!sort) {
                return targetDataModels;
            }
            const [[key, value]] = Object.entries((sort));
            return orderBy(targetDataModels, [key], [value]);
        },
        [sort]
    );

    const data = listQuery.loading ? [] : listQuery.data.targetDataModels.listTargetDataModels;

    const deleteTargetDataModel = useCallback(
        item => {
            showConfirmation(async () => {
                const response = await deleteIt({
                    variables: item
                });

                const { error } = response.data.targetDataModels.deleteTargetDataModel;
                if (error) {
                    return showSnackbar(error.message);
                }

                showSnackbar(`Target Data Model "${item.id}" deleted.`);

                if (currentTargetDataModelId === item.id) {
                    history.push(`/target-data-models`);
                }
            });
        },
        [currentTargetDataModelId]
    );

    const loading = [listQuery, deleteMutation].some(item => item.loading);
    const targetDataModels = sortTargetDataModelsList(data);

    const currentTargetDataModel = useCallback(() => history.push("/target-data-models?new"), []);

    const editTargetDataModel = useCallback(id => {
        history.push(`/target-data-models?id=${id}`);
    }, []);

    return {
        targetDataModels,
        loading,
        currentTargetDataModelId,
        currentTargetDataModel,
        filter,
        setFilter,
        sort,
        setSort,
        editTargetDataModel,
        deleteTargetDataModel
    };
};
