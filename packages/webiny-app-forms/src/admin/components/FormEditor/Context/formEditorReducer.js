// @flow
import type { UseFormEditorReducerStateType } from "webiny-app-forms/types";

export function init(props: UseFormEditorReducerStateType) {
    return {
        apollo: null,
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
            next.editField = action.data;
            break;
        }
    }

    return next;
}
