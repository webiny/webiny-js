// @flow
import { set } from "dot-prop-immutable";
import { createAction, addReducer, addMiddleware } from "webiny-app/redux";
import { getElement } from "webiny-app-cms/editor/selectors";
import { updateElement } from "webiny-app-cms/editor/actions";

const PREFIX = "[Row]";

export const ROW_RESIZE_START = `${PREFIX} Resize start`;
export const ROW_RESIZE_END = `${PREFIX} Resize end`;
export const ROW_RESIZE_COLUMN = `${PREFIX} Resize column`;

export const resizeRowColumn = createAction(ROW_RESIZE_COLUMN, { log: false });
addMiddleware([ROW_RESIZE_COLUMN], ({ store, next, action }) => {
    next(action);

    let { row: rowPath, column, change } = action.payload;
    const row = getElement(store.getState(), rowPath);
    change = parseFloat(change.toFixed(2));

    let rightCol = row.elements[column];
    let leftCol = row.elements[column - 1];

    let leftWidth = leftCol.data.width;
    let rightWidth = rightCol.data.width;
    const totalWidth = leftWidth + rightWidth;

    // Apply the change
    rightWidth += change;
    leftWidth = totalWidth - rightWidth;

    if (rightWidth < 10) {
        rightWidth = 10;
        leftWidth = totalWidth - rightWidth;
    }

    if (leftWidth < 10) {
        leftWidth = 10;
        rightWidth = totalWidth - leftWidth;
    }

    leftCol = set(leftCol, "data.width", parseFloat(leftWidth.toFixed(2)));
    rightCol = set(rightCol, "data.width", parseFloat(rightWidth.toFixed(2)));
    store.dispatch(updateElement({ element: leftCol, history: false }));
    store.dispatch(updateElement({ element: rightCol, history: false }));
});

export const resizeStart = createAction(ROW_RESIZE_START);
export const resizeStop = createAction(ROW_RESIZE_END);
addReducer([ROW_RESIZE_START, ROW_RESIZE_END], "editor.ui.resizing", (state, action) => {
    return action.type === ROW_RESIZE_START;
});
