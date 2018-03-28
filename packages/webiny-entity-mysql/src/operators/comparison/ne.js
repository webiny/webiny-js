// @flow
import _ from "lodash";
import type { Operator } from "../../../types";

const ne: Operator = {
    canProcess: ({ value }) => {
        return _.has(value, "$ne");
    },
    process: ({ key, value, statement }) => {
        if (value["$ne"] === null) {
            return key + " IS NOT NULL";
        }

        return key + " <> " + statement.escape(value["$ne"]);
    }
};
export default ne;
