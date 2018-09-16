import { getEditor } from "webiny-app-cms/editor/selectors";
/**
 * Get page data.
 */
export const getPage = state => getEditor(state).page || {};
