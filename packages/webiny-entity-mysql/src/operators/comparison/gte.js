// @flow
import _ from "lodash";
import type { Operator } from "../../../types";

const gte: Operator = {
    canProcess: ({ value }) => {
        return _.has(value, "$gte");
    },
    process: ({ key, value, statement }) => {
        return "`" + key + "` >= " + statement.escape(value["$gte"]);
    }
};
export default gte;
