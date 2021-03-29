import { UseContentModelEditorReducerState } from "~/types";

export function init(props: UseContentModelEditorReducerState) {
    return {
        ...props
    };
}

export function contentModelEditorReducer(state: any, action: { data: any; type: string }) {
    switch (action.type) {
        case "state":
            return { ...state, ...action.data };

        case "data":
            return { ...state, data: action.data };
    }
}
