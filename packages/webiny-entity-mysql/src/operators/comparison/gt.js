// @flow
import _ from "lodash";
import type { Operator } from "../../../types";

const gt: Operator = {
    canProcess: ({ value }) => {
        return _.has(value, "$gt");
    },
    process: ({ key, value, statement }) => {
        return key + " > " + statement.escape(value["$gt"]);
    }
};
export default gt;
