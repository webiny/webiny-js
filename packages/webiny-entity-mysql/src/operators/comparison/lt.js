// @flow
import _ from "lodash";
import type { Operator } from "../../../types";

const lt: Operator = {
    canProcess: ({ value }) => {
        return _.has(value, "$lt");
    },
    process: ({ key, value, statement }) => {
        return key + " < " + statement.escape(value["$lt"]);
    }
};
export default lt;
