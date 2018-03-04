// @flow
import _ from "lodash";
import type { Operator } from "../../../types";

const eq: Operator = {
    canProcess: ({ key, value }) => {
        if (key.charAt(0) === "$") {
            return false;
        }

        if (_.has(value, "$eq")) {
            return true;
        }

        // Valid values are 1, '1', null, true, false
        return _.isString(value) || _.isNumber(value) || [null, true, false].includes(value);
    },
    process: ({ key, value, statement }) => {
        value = _.get(value, "$eq", value);

        if (value === null) {
            return key + " IS NULL";
        }

        return key + " = " + statement.escape(value);
    }
};

export default eq;
