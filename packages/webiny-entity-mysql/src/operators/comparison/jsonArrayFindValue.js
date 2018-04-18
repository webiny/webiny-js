// @flow
import _ from "lodash";
import type { Operator } from "../../../types";

const jsonArrayFindValue: Operator = {
    canProcess: ({ value }) => {
        return _.has(value, "$jsonArrayFindValue");
    },
    process: ({ key, value, statement }) => {
        value = value["$jsonArrayFindValue"];
        return "JSON_SEARCH(`" + key + "`, 'one', " + statement.escape(value) + ") IS NOT NULL";
    }
};
export default jsonArrayFindValue;
