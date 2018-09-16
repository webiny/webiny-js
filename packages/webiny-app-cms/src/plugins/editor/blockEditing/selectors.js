import { getBlocks } from "webiny-app-cms/editor/selectors";

export const getBlocksCount = state => getBlocks(state).length;
