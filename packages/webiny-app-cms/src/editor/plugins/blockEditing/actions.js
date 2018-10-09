import { createAction, addReducer, addMiddleware } from "webiny-app/redux";
import { getPlugin } from "webiny-app/plugins";
import { updateChildPaths } from "webiny-app-cms/editor/utils";

const PREFIX = "[Add block]";

export const INSERT_BLOCK = `${PREFIX} Insert block`;
export const CREATE_BLOCK_FROM_TYPE = `${PREFIX} Create block from type`;

export const createBlockFromType = createAction(CREATE_BLOCK_FROM_TYPE);
addMiddleware([CREATE_BLOCK_FROM_TYPE], ({ store, next, action }) => {
    next(action);

    store.dispatch(insertBlock({ block: getPlugin(action.payload.type).create() }));
});

export const insertBlock = createAction(INSERT_BLOCK);
addReducer([INSERT_BLOCK], "editor.page.content", (state, action) => {
    const { block, position = null } = action.payload;
    block.path = state.length.toString();
    updateChildPaths(block);
    if (typeof position === "number") {
        return [...state.slice(0, position), block, ...state.slice(position)];
    }
    return [...state, block];
});
