import React, { useReducer } from "react";
import { flatten } from "lodash";
import dp from "dot-prop-immutable";

const INIT_STATE = {
    title: "Untitled",
    version: 1,
    locked: false,
    fields: [],
    triggers: {
        redirect: "",
        message: null,
        webhook: ""
    }
};

const useEditorState = (initialState = INIT_STATE) => {
    const [state, dispatch] = useReducer(
        (oldState, newState) => ({ ...oldState, ...newState }),
        initialState
    );

    function setState(setter) {
        dispatch(typeof setter === "function" ? setter(state) : setter);
    }

    function findFieldPosition(id) {
        for (let i = 0; i < state.fields.length; i++) {
            const row = state.fields[i];
            for (let j = 0; j < row.length; j++) {
                if (row[j]._id === id) {
                    return { row: i, index: j };
                }
            }
        }

        return { row: null, index: null };
    }

    function deleteFormField(data) {
        setState(state => {
            const { row, index } = findFieldPosition(data._id);
            let newState = dp.delete(state, `fields.${row}.${index}`);
            if (newState.fields[row].length === 0) {
                newState = dp.delete(state, `fields.${row}`);
            }
            return newState;
        });
    }

    function isFieldIdInUse(id) {
        return !!flatten(state.fields).find(f => f.id === id);
    }

    return {
        formState: state,
        setFormState: setState,
        deleteFormField,
        isFieldIdInUse,
        findFieldPosition
    };
};

const FormEditorContext = React.createContext();

const FormEditorProvider = ({ value, children }) => {
    const editorState = useEditorState(value);

    return <FormEditorContext.Provider value={editorState}>{children}</FormEditorContext.Provider>;
};

export { FormEditorContext, FormEditorProvider };
