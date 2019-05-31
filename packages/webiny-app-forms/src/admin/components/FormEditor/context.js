import React from "react";
import { flatten } from "lodash";
import dp from "dot-prop-immutable";
import shortid from "shortid";
import { set } from "dot-prop-immutable";
import get from "lodash.get";
import pick from "lodash.pick";
import debounce from "lodash.debounce";
import { getForm, updateRevision } from "./graphql";

const defaultData = () => ({
    name: "Unnamed",
    version: 1,
    locked: false,
    fields: [],
    triggers: {
        redirect: "",
        message: null,
        webhook: ""
    }
});

function init(props) {
    return {
        apollo: null,
        loaded: false,
        fields: [],
        data: defaultData(),
        ...props
    };
}

function formEditorReducer(state, action) {
    const next = { ...state };
    switch (action.type) {
        case "name": {
            next.data.name = action.value;
            break;
        }
        case "fields": {
            next.fields = action.data;
            break;
        }
        case "loaded": {
            next.loaded = action.state;
            break;
        }
        case "data": {
            next.data = action.data;
            break;
        }
    }

    return next;
}

const FormEditorContext = React.createContext();

function FormEditorProvider(props) {
    const [state, dispatch] = React.useReducer(formEditorReducer, props, init);

    const value = React.useMemo(() => {
        return {
            state,
            dispatch
        };
    });

    return <FormEditorContext.Provider value={value} {...props} />;
}

function useFormEditor() {
    const context = React.useContext(FormEditorContext);
    if (!context) {
        throw new Error("useFormEditor must be used within a FormEditorProvider");
    }

    const { state, dispatch } = context;

    const self = {
        apollo: state.apollo,
        async getForm(id) {
            let response = await self.apollo.query({ query: getForm, variables: { id } });
            const data = get(response, "data.forms.getForm");
            dispatch({ type: "data", data: data.data });
            dispatch({ type: "loaded", state: true });
            return data;
        },
        saveForm: async () => {
            const data = state.data;
            let response = await self.apollo.mutate({
                mutation: updateRevision,
                variables: { id: data.id, data: pick(data, ["fields", "name"]) }
            });

            return get(response, "data.forms.updateRevision");
        },
        setName(name) {
            dispatch({ type: "name", value: name });
        },
        getName() {
            return state.data.name;
        },
        setFields(data) {
            dispatch({ type: "fields", data });
        },
        getFields() {
            return state.data.fields;
        },
        insertField(fieldData, position) {
            const { row, index } = position;

            if (!fieldData._id) {
                fieldData._id = shortid.generate();
            }

            // Setting a form field into a new non-existing row.
            if (!state.fields[row]) {
                self.setFields(set(state.fields, row, [fieldData]));
                return;
            }

            const { fields } = state;

            // If row exists, we drop the field at the specified index.

            if (index === null) {
                // Create a new row with the new field at the given row index
                console.log("cemu ovo sluzi?! ");
                self.setFields(
                    set(state, "fields", [
                        ...fields.slice(0, row),
                        [fieldData],
                        ...fields.slice(row)
                    ])
                );
                return;
            }

            // We are dropping a new field at the specified index.
            self.setFields(
                set(state.fields, row, [
                    ...fields[row].slice(0, index),
                    fieldData,
                    ...fields[row].slice(index)
                ])
            );
        },
        findFieldPosition(id) {
            for (let i = 0; i < state.fields.length; i++) {
                const row = state.fields[i];
                for (let j = 0; j < row.length; j++) {
                    if (row[j]._id === id) {
                        return { row: i, index: j };
                    }
                }
            }

            return { row: null, index: null };
        },
        deleteField(field) {
            const { row, index } = self.findFieldPosition(field._id);
            let data = dp.delete(state.fields, `${row}.${index}`);
            if (data[row].length === 0) {
                data = dp.delete(data, row);
            }

            dispatch({ type: "fields", data });
        },

        // -------------------------------------------------------------------
        isFieldIdInUse(id) {
            return !!flatten(state.fields).find(f => f.id === id);
        },

        saveField(data) {
            if (!data._id) {
                setFormState(insertField(data, createAt.current));
            } else {
                setFormState(updateField(data));
            }
        },

        updateField(fieldData) {
            const { row, index } = findFieldPosition(fieldData._id);
            setFormState(set(state, ["fields", row, index], fieldData));
        },

        state,
        dispatch
    };

    return self;
}

export { FormEditorProvider, useFormEditor };
