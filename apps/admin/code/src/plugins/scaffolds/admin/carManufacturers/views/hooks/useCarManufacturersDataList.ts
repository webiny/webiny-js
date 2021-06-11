import { useCallback, useState } from "react";
import orderBy from "lodash/orderBy";
import { useRouter } from "@webiny/react-router";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { LIST_CAR_MANUFACTURERS, DELETE_CAR_MANUFACTURER } from "./graphql";

interface Config {
    sorters: { label: string; value: string }[];
}

interface useCarManufacturersDataListHook {
    (config: Config): {
        loading: boolean;
        carManufacturers: Array<{
            id: string;
            title: string;
            description: string;
            createdOn: string;
            [key: string]: any;
        }>;
        currentCarManufacturerId: string;
        currentCarManufacturer: () => void;
        filter: string;
        setFilter: (filter: string) => void;
        sort: string;
        setSort: (sort: string) => void;
        editCarManufacturer: (id: string) => void;
        deleteCarManufacturer: (id: string) => void;
    };
}

export const useCarManufacturersDataList: useCarManufacturersDataListHook = (config: Config) => {
    const defaultSorter = config.sorters.length ? config.sorters[0].value : null;
    const [filter, setFilter] = useState<string>("");
    const [sort, setSort] = useState<string>((defaultSorter));
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const listQuery = useQuery(LIST_CAR_MANUFACTURERS);
    const searchParams = new URLSearchParams(location.search);
    const currentCarManufacturerId = searchParams.get("id");
    const [deleteIt, deleteMutation] = useMutation(DELETE_CAR_MANUFACTURER, {
        refetchQueries: [{ query: LIST_CAR_MANUFACTURERS }]
    });

    const { showConfirmation } = useConfirmationDialog();

    const sortCarManufacturersList = useCallback(
        carManufacturers => {
            if (!sort) {
                return carManufacturers;
            }
            const [[key, value]] = Object.entries((sort));
            return orderBy(carManufacturers, [key], [value]);
        },
        [sort]
    );

    const data = listQuery.loading ? [] : listQuery.data.carManufacturers.listCarManufacturers;

    const deleteCarManufacturer = useCallback(
        item => {
            showConfirmation(async () => {
                const response = await deleteIt({
                    variables: item
                });

                const { error } = response.data.carManufacturers.deleteCarManufacturer;
                if (error) {
                    return showSnackbar(error.message);
                }

                showSnackbar(`Car Manufacturer "${item.id}" deleted.`);

                if (currentCarManufacturerId === item.id) {
                    history.push(`/car-manufacturers`);
                }
            });
        },
        [currentCarManufacturerId]
    );

    const loading = [listQuery, deleteMutation].some(item => item.loading);
    const carManufacturers = sortCarManufacturersList(data);

    const currentCarManufacturer = useCallback(() => history.push("/car-manufacturers?new"), []);

    const editCarManufacturer = useCallback(id => {
        history.push(`/car-manufacturers?id=${id}`);
    }, []);

    return {
        carManufacturers,
        loading,
        currentCarManufacturerId,
        currentCarManufacturer,
        filter,
        setFilter,
        sort,
        setSort,
        editCarManufacturer,
        deleteCarManufacturer
    };
};
