// @flow
import _ from "lodash";
import type { Operator } from "../../../types";

const jsonArrayStrictEquality: Operator = {
    canProcess: ({ value }) => {
        return _.has(value, "$jsonArrayStrictEquality");
    },
    process: ({ key, value, statement }) => {
        value = value["$jsonArrayStrictEquality"];
        return key + " = JSON_ARRAY(" + value.map(v => statement.escape(v)).join(", ") + ")";
    }
};
export default jsonArrayStrictEquality;
