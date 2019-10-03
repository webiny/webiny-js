// @flow
import React, { useState } from "react";
import { useMutation, useQuery } from "react-apollo";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useDialog } from "@webiny/app-admin/hooks/useDialog";
import { useDataList } from "@webiny/app/hooks/useDataList";
import useReactRouter from "use-react-router";
import { getData, getError } from "./functions";
import { get } from "lodash";
import { i18n } from "@webiny/app/i18n";

type Props = {
    create?: {},
    read?: {},
    list?: {},
    update?: {},
    delete?: {}
};

const t = i18n.ns("app-admin/contexts");

export const CrudContext = React.createContext();

export const CrudProvider = ({ children, ...props }: Props) => {
    const { showSnackbar } = useSnackbar();
    const { showDialog } = useDialog();
    const { location, history } = useReactRouter();

    const list = useDataList({
        name: "dataList", // TODO: ???
        query: get(props, "list.query", props.list),
        variables: get(props, "list.variables"),
        // "useDataList" will know how to handle no-handler-provided situations.
        getData: get(props, "list.getData"),
        getMeta: get(props, "list.getMeta"),
        getError: get(props, "list.getError")
    });

    const [mutationInProgress, setMutationInProgress] = useState(false);
    const [invalidFields, setInvalidFields] = useState({});

    const urlSearchParams = new URLSearchParams(location.search);
    const id = urlSearchParams.get("id");

    const [createMutation] = useMutation(props.create.mutation || props.create);
    const [updateMutation] = useMutation(props.update.mutation || props.update);
    const [deleteMutation] = useMutation(props.delete.mutation || props.delete);

    const readQuery = useQuery(props.read.query || props.read, {
        variables: { id },
        skip: !id,
        onCompleted(data) {
            const error = get(props, "read.getError", getError)(data);
            if (!error) {
                return;
            }

            const query = new URLSearchParams(location.search);
            query.delete("id");
            history.push({ search: query.toString() });
            showSnackbar(error.message);
        }
    });

    const actions = {
        delete: async (item: Object) => {
            const res = await deleteMutation({ variables: { id: item.id } });
            const error = get(props, "delete.getError", getError)(res);

            if (error) {
                let message = error.message || t`Could not delete record.`;
                showSnackbar(message, {
                    title: "Something unexpected happened"
                });
            } else {
                let message = get(props, "delete.snackbar", t`Record deleted successfully.`);
                if (typeof message === "function") {
                    message = message(item);
                }
                showSnackbar(message);
            }

            if (item.id === id) {
                const query = new URLSearchParams(location.search);
                query.delete("id");
                history.push({ search: query.toString() });
            }

            list.refresh();
        },
        save: async (formData: Object) => {
            const action = id ? "update" : "create";
            setMutationInProgress(true);
            setInvalidFields(null);

            const variablesHandler = get(props[action], "variables");
            const variables = variablesHandler ? variablesHandler(formData) : { data: formData };
            const operation =
                action === "create"
                    ? createMutation({ variables })
                    : updateMutation({ variables: { id, ...variables } });

            return operation.then(response => {
                const data = get(props[action], "getData", getData)(response.data);
                const error = get(props[action], "getError", getError)(response.data);

                if (error) {
                    if (error.code === "VALIDATION_FAILED_INVALID_FIELDS") {
                        showSnackbar(t`One or more fields invalid.`);
                        setInvalidFields(error.data.invalidFields);
                    } else {
                        let message = error.message || t`Could not save record.`;
                        showDialog(message, {
                            title: t`Something unexpected happened`
                        });
                    }
                    return;
                }

                let message = get(props[action], "snackbar", t`Record saved successfully.`);
                if (typeof message === "function") {
                    message = message(data);
                }
                showSnackbar(message);

                const query = new URLSearchParams(location.search);
                query.set("id", data.id);
                history.push({ search: query.toString() });

                !id && list.refresh();
                setMutationInProgress(false);
            });
        },
        resetForm: () => {
            const query = new URLSearchParams(location.search);
            query.delete("id");
            history.push({ search: query.toString() });
        }
    };

    const form = {
        data: props.read.getData ? props.read.getData(readQuery.data) : getData(readQuery.data),
        error: props.read.getError ? props.read.getError(readQuery.data) : getError(readQuery.data),
        onSubmit: actions.save,
        loading: mutationInProgress || readQuery.loading,
        id,
        invalidFields
    };

    if (!form.data) {
        form.data = {};
    }

    return (
        <CrudContext.Provider value={{ form, list, actions }}>
            {React.isValidElement(children) ? children : children({ form, list, actions })}
        </CrudContext.Provider>
    );
};
