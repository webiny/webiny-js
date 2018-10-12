// @flow
import type { WithDataListParams } from "./types";

/**
 * All list data is passed into child components via specific prop. Be default, "name" parameter will be
 * used to determine its name. Alternatively, "prop" parameter can be used to specify a different name.
 * @param withDataListParams
 * @returns {*}
 */
export default (withDataListParams: WithDataListParams): string =>
    withDataListParams.prop || withDataListParams.name;
