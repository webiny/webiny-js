import { useCallback } from "react";
import { useMutation, useQuery } from "@apollo/react-hooks";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import {
    GET_CAR_MANUFACTURER,
    CREATE_CAR_MANUFACTURER,
    UPDATE_CAR_MANUFACTURER,
    LIST_CAR_MANUFACTURERS
} from "./graphql";

export const useCarManufacturersForm = () => {
    const { location, history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const searchParams = new URLSearchParams(location.search);
    const currentCarManufacturerId = searchParams.get("id");

    const getQuery = useQuery(GET_CAR_MANUFACTURER, {
        variables: { id: currentCarManufacturerId },
        skip: !currentCarManufacturerId,
        onCompleted: data => {
            const error = data?.carManufacturers?.getCarManufacturer?.error;
            if (error) {
                history.push("/car-manufacturers");
                showSnackbar(error.message);
            }
        }
    });

    const [create, createMutation] = useMutation(CREATE_CAR_MANUFACTURER, {
        refetchQueries: [{ query: LIST_CAR_MANUFACTURERS }]
    });

    const [update, updateMutation] = useMutation(UPDATE_CAR_MANUFACTURER, {
        refetchQueries: [{ query: LIST_CAR_MANUFACTURERS }]
    });

    const loading = [getQuery, createMutation, updateMutation].some(item => item.loading);

    const onSubmit = useCallback(
        async data => {
            const isUpdate = data.createdOn;
            const [operation, args] = isUpdate
                ? [update, { variables: { id: data.id, data } }]
                : [create, { variables: { data } }];

            const response = await operation(args);

            const error = response?.data?.carManufacturers?.carManufacturer;
            if (error) {
                return showSnackbar(error.message);
            }

            !isUpdate && history.push(`/car-manufacturers?id=${data.id}`);
            showSnackbar("Car Manufacturer saved successfully.");
        },
        [currentCarManufacturerId]
    );

    // TODO: Use {} or null or just leave undefined?
    const carManufacturer = getQuery?.data?.carManufacturers?.getCarManufacturer.data;

    // TODO: Check `showEmptyView`, can this be simplified?
    const emptyViewIsShown = !searchParams.get("new") && !loading && !carManufacturer;
    const currentCarManufacturer = useCallback(() => history.push("/car-manufacturers?new"), []);
    const cancelEditing = useCallback(() => history.push("/car-manufacturers"), []);

    return {
        loading,
        emptyViewIsShown,
        currentCarManufacturer,
        cancelEditing,
        carManufacturer,
        onSubmit
    };
};
