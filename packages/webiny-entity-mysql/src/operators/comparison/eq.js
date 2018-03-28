// @flow
import _ from "lodash";
import type { Operator } from "../../../types";
import { ArrayAttribute } from "webiny-model";
import jsonArrayStrictEquality from "./../comparison/jsonArrayStrictEquality";
import jsonArrayFindValue from "./../comparison/jsonArrayFindValue";

const eq: Operator = {
    canProcess: ({ key, value, statement }) => {
        if (key.charAt(0) === "$") {
            return false;
        }

        if (_.has(value, "$eq")) {
            return true;
        }

        // Valid values are 1, '1', null, true, false.
        if (_.isString(value) || _.isNumber(value) || [null, true, false].includes(value)) {
            return true;
        }

        const instance =
            typeof statement.entity === "function" ? new statement.entity() : statement.entity;
        const attribute = instance.getAttribute(key);
        return attribute instanceof ArrayAttribute && Array.isArray(value);
    },
    process: ({ key, value, statement }) => {
        value = _.get(value, "$eq", value);
        if (value === null) {
            return key + " IS NULL";
        }

        const instance =
            typeof statement.entity === "function" ? new statement.entity() : statement.entity;
        const attribute = instance.getAttribute(key);
        if (attribute instanceof ArrayAttribute) {
            // Match all values (strict array equality check)
            if (Array.isArray(value)) {
                return jsonArrayStrictEquality.process({
                    key,
                    value: { $jsonArrayStrictEquality: value },
                    statement
                });
            } else {
                return jsonArrayFindValue.process({
                    key,
                    value: { $jsonArrayFindValue: value },
                    statement
                });
            }
        }

        return key + " = " + statement.escape(value);
    }
};

export default eq;
