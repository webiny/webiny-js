// @flow
import * as React from "react";
import { setDisplayName, compose, withProps, mapProps, withHandlers, withState } from "recompose";
import { withRouter } from "react-router-dom";
import { graphql } from "react-apollo";
import { withDataList } from "@webiny/app/components";
// import getFormData from "./withCrud/getFormData";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";

import {
    withSnackbar,
    withDialog,
    type WithDialogProps,
    type WithSnackbarProps
} from "@webiny/app-admin/components";

export type WithCrudBaseProps = WithSnackbarProps & WithDialogProps;

export type WithCrudListProps = WithCrudBaseProps & {
    dataList: Object,
    deleteRecord: (item: Object) => Promise<void>
};

export type WithCrudFormProps = WithCrudBaseProps & {
    invalidFields: Object,
    loading: boolean,
    onSubmit: (data: Object) => void,
    data: Object,
    error: Object | null
};

export type WithCrudProps = WithCrudBaseProps & {
    listProps: WithCrudListProps,
    formProps: WithCrudFormProps
};

const createDeleteHandler = ({ mutation, response, snackbar }): Function => {
    return (Component: typeof React.Component) => {
        return compose(
            setDisplayName("deleteHandler"),
            graphql(mutation, { name: "deleteRecord" }),
            withHandlers({
                deleteRecord: ({
                    deleteRecord,
                    showSnackbar,
                    location,
                    history,
                    dataList,
                    id
                }: Object) => {
                    return async (item: Object) => {
                        const res = await deleteRecord({ variables: { id: item.id } });
                        const { data, error } = response(res.data);

                        if (data) {
                            showSnackbar(snackbar(item));
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
                    };
                }
            })
        )(Component);
    };
};

const createSaveHandler = ({ create, update, response, variables, snackbar }): Function => {
    return (Component: typeof React.Component) => {
        return compose(
            setDisplayName("saveHandler"),
            withState("invalidFields", "setInvalidFields", {}),
            withState("mutationInProgress", "setMutationInProgress", false),
            graphql(create, { name: "createRecord" }),
            graphql(update, { name: "updateRecord" }),
            withHandlers({
                saveRecord: ({
                    createRecord,
                    updateRecord,
                    setMutationInProgress,
                    setInvalidFields,
                    showSnackbar,
                    showDialog,
                    location,
                    history,
                    dataList,
                    id
                }: Object) => {
                    setMutationInProgress(true);
                    return async (formData: Object) => {
                        // Reset errors
                        setInvalidFields(null);
                        // Get variables
                        const gqlVariables = variables(formData);
                        const operation = id
                            ? updateRecord({ variables: { id, ...gqlVariables } })
                            : createRecord({ variables: gqlVariables });
                        return operation
                            .then(res => {
                                const { data, error } = response(res.data);
                                if (error) {
                                    if (error.code === "INVALID_ATTRIBUTES") {
                                        showSnackbar("Some of your form input is incorrect!");
                                        setInvalidFields(error.data.invalidAttributes);
                                        return;
                                    } else {
                                        showDialog(error.message, {
                                            title: "Something unexpected happened"
                                        });
                                        return;
                                    }
                                }
                                showSnackbar(snackbar(data));

                                const query = new URLSearchParams(location.search);
                                query.set("id", data.id);
                                history.push({ search: query.toString() });

                                !id && dataList.refresh();
                            })
                            .then(res => {
                                setMutationInProgress(false);
                                return res;
                            });
                    };
                }
            })
        )(Component);
    };
};

export const withCrud = ({ list, form }: Object): Function => {
    return (Component: typeof React.Component) => {
        return compose(
            // setDisplayName("withCrud"),
            // withSnackbar(),
            // TODO: withDialog(),
            withRouter,
            withProps(({ location }) => {
                const query = new URLSearchParams(location.search);
                return { id: query.get("id") };
            }),
            // Use existing `withDataList` HOC to handle DataList component
            withDataList({
                name: "dataList",
                query: list.get.query,
                variables: list.get.variables,
                response: list.get.response
            }),
            // Delete mutation
            list.delete && withDeleteHandler(list.delete),
            // Form GET query
            graphql(form.get.query, {
                options: ({ showSnackbar, location, history }) => ({
                    onCompleted(data) {
                        const { error } = getFormData({ data, form });
                        if (error) {
                            const query = new URLSearchParams(location.search);
                            query.delete("id");
                            history.push({ search: query.toString() });
                            showSnackbar(error.message);
                        }
                    }
                }),
                variables: props => ({ id: props.id }),
                skip: props => !props.id,
                props: ({ data }: Object) => {
                    return { formData: getFormData({ data, form }) };
                }
            }),
            withSaveHandler(form.save),
            mapProps((props: Object): WithCrudProps => {
                const {
                    dataList,
                    saveRecord,
                    formData,
                    mutationInProgress,
                    invalidFields,
                    showSnackbar,
                    showDialog,
                    deleteRecord
                } = props;

                return {
                    showSnackbar,
                    showDialog,
                    listProps: {
                        dataList,
                        showSnackbar,
                        showDialog,
                        deleteRecord
                    },
                    formProps: {
                        ...formData,
                        invalidFields,
                        onSubmit: saveRecord,
                        loading: (formData && formData.loading) || mutationInProgress,
                        showSnackbar,
                        showDialog
                    }
                };
            })
        )(Component);
    };
};

const useCrud = ({location, }) => {
    const { showSnackbar } = useSnackbar();

    return {
        showSnackbar,
        // TODO: showDialog,
        listProps: {
            dataList,
            showSnackbar,
            showDialog,
            deleteRecord
        },
        formProps: {
            ...formData,
            invalidFields,
            onSubmit: saveRecord,
            loading: (formData && formData.loading) || mutationInProgress,
            showSnackbar,
            showDialog
        }
    }
};

export { useCrud };
