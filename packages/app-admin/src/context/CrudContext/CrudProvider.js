// @flow
import React, { useState, useContext } from "react";
import { useMutation, useQuery } from "react-apollo";
import getFormData from "./getFormData";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useDialog } from "@webiny/app-admin/hooks/useDialog";
import { useDataList } from "@webiny/app/hooks/useDataList";
import useReactRouter from "use-react-router";

const CrudContext = React.createContext();

const CrudProvider = ({ children }: Object) => {
    const value = {
        state: {
            list: {
                current: {}
            },
            form: {
                current: {}
            }
        }
    };

    return <CrudContext.Provider value={value}>{children}</CrudContext.Provider>;
};

function useCrudList(list) {
    const context = useContext(CrudContext);
    if (!context) {
        throw new Error("useCrudList hook must be used within the CrudProvider.");
    }

    const { location, history } = useReactRouter();
    const { showSnackbar } = useSnackbar();
    const dataList = useDataList({
        name: "dataList",
        query: list.get.query,
        variables: list.get.variables,
        response: list.get.response
    });

    const urlSearchParams = new URLSearchParams(location.search);
    const id = urlSearchParams.get("id");

    const [deleteRecord] = useMutation(list.delete.mutation);

    return {
        ...dataList,
        deleteRecord: async (item: Object) => {
            const res = await deleteRecord({ variables: { id: item.id } });
            const { data, error } = list.delete.response(res.data);

            if (data) {
                showSnackbar(list.delete.snackbar(item));
            } else {
                showSnackbar(error.message, {
                    title: "Something unexpected happened"
                });
            }

            if (item.id === id) {
                const query = new URLSearchParams(location.search);
                query.delete("id");
                history.push({ search: query.toString() });
            }

            dataList.refresh();
        }
    };
}

function useCrudForm(form) {
    const context = useContext(CrudContext);
    if (!context) {
        throw new Error("useCrudList hook must be used within the CrudProvider.");
    }

    const { location, history } = useReactRouter();
    const { showSnackbar } = useSnackbar();
    const { showDialog } = useDialog();

    const [mutationInProgress, setMutationInProgress] = useState(false);
    const [invalidFields, setInvalidFields] = useState({});

    const urlSearchParams = new URLSearchParams(location.search);
    const id = urlSearchParams.get("id");

    const [createRecord] = useMutation(form.save.create);
    const [updateRecord] = useMutation(form.save.update);

    const { data: getRecord } = useQuery(form.get.query, {
        variables: { id },
        skip: !id,
        onCompleted(data) {
            const { error } = getFormData({ data, form });
            if (error) {
                const query = new URLSearchParams(location.search);
                query.delete("id");
                history.push({ search: query.toString() });
                showSnackbar(error.message);
            }
        }
    });

    const formData = getFormData({ data: getRecord, form });

    return {
        ...formData,
        onSubmit: async (formData: Object) => {
            setMutationInProgress(true);
            // Reset errors
            setInvalidFields(null);
            // Get variables
            const gqlVariables = form.save.variables(formData);
            const operation = id
                ? updateRecord({ variables: { id, ...gqlVariables } })
                : createRecord({ variables: gqlVariables });

            return operation
                .then(res => {
                    const { data, error } = form.save.response(res.data);
                    if (error) {
                        if (error.code === "INVALID_ATTRIBUTES") {
                            showSnackbar("Some of your form input is incorrect!");
                            setInvalidFields(error.data.invalidAttributes);
                        } else {
                            showDialog(error.message, {
                                title: "Something unexpected happened"
                            });
                        }
                        return;
                    }
                    showSnackbar(form.save.snackbar(data));

                    const query = new URLSearchParams(location.search);
                    query.set("id", data.id);
                    history.push({ search: query.toString() });

                    !id && console.log("dataList.refresh();"); // TODO
                })
                .then(res => {
                    setMutationInProgress(false);
                    return res;
                });
        },
        loading: mutationInProgress || (formData && formData.loading),
        invalidFields
    };
}

export { CrudProvider, useCrudList, useCrudForm };
