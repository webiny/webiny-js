// @flow
import * as React from "react";
import { setDisplayName, compose, withProps, mapProps, withHandlers, withState } from "recompose";
import { graphql } from "react-apollo";
import { omit } from "lodash";
import { withDataList, withRouter } from "webiny-app/components";
import { withSnackbar } from "webiny-app-admin/components";

const withDeleteHandler = ({ mutation, response, snackbar }): Function => {
    return (Component: typeof React.Component) => {
        return compose(
            setDisplayName("deleteHandler"),
            graphql(mutation, { name: "deleteRecord" }),
            withHandlers({
                deleteRecord: ({ deleteRecord, showSnackbar, router, dataList, id }: Object) => {
                    return async (item: Object) => {
                        const res = await deleteRecord({ variables: { id: item.id } });
                        const { data, error } = response(res.data);

                        if (data) {
                            showSnackbar(snackbar(item));
                        } else {
                            showSnackbar(error.message, {
                                dismissesOnAction: true,
                                actionText: "Close"
                            });
                        }

                        if (item.id === id) {
                            router.goToRoute({
                                params: { id: null },
                                merge: true
                            });
                        }

                        dataList.refresh();
                    };
                }
            })
        )(Component);
    };
};

const withSaveHandler = ({ create, update, response, variables, snackbar }): Function => {
    return (Component: typeof React.Component) => {
        return compose(
            setDisplayName("saveHandler"),
            withState("formError", "setFormError", null),
            withState("invalidFields", "setInvalidFields", {}),
            graphql(create, { name: "createRecord" }),
            graphql(update, { name: "updateRecord" }),
            withHandlers({
                saveRecord: ({
                    createRecord,
                    updateRecord,
                    setInvalidFields,
                    setFormError,
                    showSnackbar,
                    router,
                    dataList,
                    id
                }: Object) => {
                    return async (formData: Object) => {
                        // Reset errors
                        setFormError(null);
                        setInvalidFields(null);
                        // Get variables
                        const gqlVariables = variables(formData);
                        const operation = id
                            ? updateRecord({ variables: { id, ...gqlVariables } })
                            : createRecord({ variables: gqlVariables });
                        return operation.then(res => {
                            const { data, error } = response(res.data);
                            if (error) {
                                if (error.code === "INVALID_ATTRIBUTES") {
                                    showSnackbar("Some of your form input is incorrect!");
                                    setInvalidFields(error.data.invalidAttributes);
                                    return;
                                } else {
                                    showSnackbar(error.message, {
                                        dismissesOnAction: true,
                                        actionText: "Close"
                                    });
                                    return;
                                }
                            }
                            showSnackbar(snackbar(data));
                            router.goToRoute({ params: { id: data.id }, merge: true });
                            !id && dataList.refresh();
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
            setDisplayName("withCrud"),
            withSnackbar(),
            withRouter(),
            withProps(({ router }) => ({
                id: router.getQuery("id")
            })),
            // Use existing `withDataList` HOC to handle DataList component
            withDataList({
                name: "dataList",
                query: list.get.query,
                variables: list.get.variables
            }),
            // Delete mutation
            list.delete && withDeleteHandler(list.delete),
            // Form GET query
            graphql(form.get.query, {
                variables: props => ({ id: props.id }),
                skip: props => !props.id,
                props: ({ data }: Object) => ({
                    // Get form data/error from query response
                    formData: form.get.response(data)
                })
            }),
            withSaveHandler(form.save),
            mapProps((props: Object) => {
                const { router, dataList, saveRecord, formData, invalidFields, formError } = props;

                return {
                    router,
                    crudList: (listElement: React.Element<*>) => {
                        const listProps = {
                            dataList: omit(dataList, ["data"]),
                            router,
                            ...list.get.response(dataList.data)
                        };

                        if (props.deleteRecord) {
                            listProps[list.delete.name || "deleteRecord"] = props.deleteRecord;
                        }

                        return React.cloneElement(listElement, listProps);
                    },
                    crudForm: (formElement: React.Element<*>) => {
                        const formProps = {
                            ...formData,
                            invalidFields,
                            onSubmit: saveRecord
                        };

                        if (formError) {
                            formProps.error = formError;
                        }

                        return React.cloneElement(formElement, formProps);
                    }
                };
            })
        )(Component);
    };
};
