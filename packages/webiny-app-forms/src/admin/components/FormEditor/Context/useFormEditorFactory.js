import React from "react";
import { flatten } from "lodash";
import dp from "dot-prop-immutable";
import shortid from "shortid";
import { set } from "dot-prop-immutable";
import get from "lodash.get";
import pick from "lodash.pick";
import { getForm, updateRevision } from "./graphql";

export default FormEditorContext => {
    return () => {
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
            setFields(data) {
                dispatch({ type: "fields", data });
            },
            insertField(fieldData, position) {
                const { row, index } = position;

                if (!fieldData._id) {
                    fieldData._id = shortid.generate();
                }

                const fields = state.data.fields;

                // Setting a form field into a new non-existing row.
                if (!fields[row]) {
                    self.setFields(set(fields, row, [fieldData]));
                    return;
                }

                // If row exists, we drop the field at the specified index.

                if (index === null) {
                    // Create a new row with the new field at the given row index
                    console.log("cemu ovo sluzi?! ");
                    self.setFields(
                        set(state, "data.fields", [
                            ...fields.slice(0, row),
                            [fieldData],
                            ...fields.slice(row)
                        ])
                    );
                    return;
                }

                // We are dropping a new field at the specified index.
                self.setFields(
                    set(state.data.fields, row, [
                        ...fields[row].slice(0, index),
                        fieldData,
                        ...fields[row].slice(index)
                    ])
                );
            },
            findFieldPosition(id) {
                for (let i = 0; i < state.data.fields.length; i++) {
                    const row = state.data.fields[i];
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
                let data = dp.delete(state.data.fields, `${row}.${index}`);
                if (data[row].length === 0) {
                    data = dp.delete(data, row);
                }

                dispatch({ type: "fields", data });
            },

            isFieldIdInUse(id) {
                return !!flatten(state.data.fields).find(f => f.id === id);
            },

            editField(data) {
                dispatch({ type: "editField", data });
            },
            updateField(fieldData) {
                const { row, index } = self.findFieldPosition(fieldData._id);
                const data = set(state.data.fields, [row, index], fieldData);
                dispatch({
                    type: "fields",
                    data
                });
            },

            state,
            dispatch
        };

        return self;
    };
};
