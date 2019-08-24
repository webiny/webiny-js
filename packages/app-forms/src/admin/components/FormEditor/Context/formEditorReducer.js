// @flow
import type { UseFormEditorReducerStateType } from "@webiny/app-forms/types";

export function init(props: UseFormEditorReducerStateType) {
    return {
        ...props
    };
}

export function formEditorReducer(state: Object, action: Object) {
    const next = { ...state };
    switch (action.type) {
        case "data": {
            next.data = action.data;
            break;
        }
    }

    return next;
}
