// @flow
import _ from "lodash";
import type { Operator } from "../../../types";

const lte: Operator = {
    canProcess: ({ value }) => {
        return _.has(value, "$lte");
    },
    process: ({ key, value, statement }) => {
        return key + " <= " + statement.escape(value["$lte"]);
    }
};
export default lte;
