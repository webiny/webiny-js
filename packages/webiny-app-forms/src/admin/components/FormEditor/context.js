import React, { useReducer } from "react";
import { flatten } from "lodash";
import dp from "dot-prop-immutable";

/*
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
};*/

function init() {
    return {
        data: {
            title: "Untitled",
            version: 1,
            locked: false,
            fields: [],
            triggers: {
                redirect: "",
                message: null,
                webhook: ""
            }
        }
    };
}

function formEditorReducer(state, action) {
    const next = { ...state };
    switch (action.type) {
        case "setTitle": {
            next.data.title = action.value;
            break;
        }
        case "uploading": {
            next.uploading = action.state;
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
    return {
        setTitle(title) {
            dispatch({ type: "setTitle", value: title });
        },
        getTitle() {
            return state.data.title;
        },
        state,
        dispatch
    };
}

export { FormEditorProvider, useFormEditor };
