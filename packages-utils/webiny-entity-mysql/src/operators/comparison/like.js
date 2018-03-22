// @flow
import _ from "lodash";
import type { Operator } from "../../../types";

const like: Operator = {
    canProcess: ({ key, value }) => {
        if (key.charAt(0) === "$") {
            return false;
        }

        return _.has(value, "$like");
    },
    process: ({ key, value, statement }) => {
        return key + " LIKE " + statement.escape(value["$like"]);
    }
};

export default like;
