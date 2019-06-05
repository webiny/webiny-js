// @flow
import type { UseFormEditorReducerStateType } from "webiny-app-forms/types";

export function init(props: UseFormEditorReducerStateType) {
    return {
        apollo: null,
        editField: {
            current: null,
            meta: null
        },
        data: {
            fields: [],
            layout: []
        },
        ...props
    };
}

export function formEditorReducer(state: Object, action: Object) {
    const next = { ...state };
    switch (action.type) {
        case "name": {
            next.data.name = action.value;
            break;
        }
        case "data": {
            next.data = action.data;
            break;
        }
        case "editField": {
            next.editField = {
                current: action.data,
                meta: action.meta
            };
            break;
        }
    }

    return next;
}
