import { UseContentModelEditorReducerStateType } from "@webiny/app-headless-cms/types";

export function init(props: UseContentModelEditorReducerStateType) {
    return {
        ...props
    };
}

export function contentModelEditorReducer(state: any, action: { data: any; type: string }) {
    const next = { ...state };
    switch (action.type) {
        case "data": {
            next.data = action.data;
            break;
        }
    }

    return next;
}
