export function init(props) {
    return {
        apollo: null,
        data: null,
        ...props
    };
}

export function formEditorReducer(state, action) {
    const next = { ...state };
    switch (action.type) {
        case "name": {
            next.data.name = action.value;
            break;
        }
        case "fields": {
            next.data.fields = action.data;
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