import { UseFormEditorReducerStateType } from "~/types";

export function init(props: UseFormEditorReducerStateType) {
    return {
        ...props
    };
}

export function formEditorReducer(state: any, action: { data: any; type: string }) {
    const next = { ...state };
    switch (action.type) {
        case "data": {
            next.data = action.data;
            break;
        }
    }

    return next;
}
