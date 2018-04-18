// @flow
import _ from "lodash";
import type { Operator } from "../../../types";
import { ArrayAttribute } from "webiny-model";
import or from "../logical/or";

const inOperator: Operator = {
    canProcess: ({ key, value, statement }) => {
        if (key.charAt(0) === "$") {
            return false;
        }

        if (_.has(value, "$in")) {
            return true;
        }

        const instance =
            typeof statement.entity === "function" ? new statement.entity() : statement.entity;
        const attribute = instance.getAttribute(key);

        return Array.isArray(value) && !(attribute instanceof ArrayAttribute);
    },
    process: ({ key, value, statement }) => {
        value = _.get(value, "$in", value);

        const instance =
            typeof statement.entity === "function" ? new statement.entity() : statement.entity;
        const attribute = instance.getAttribute(key);
        if (attribute instanceof ArrayAttribute) {
            const andValue = value.map(v => {
                return { [key]: { $jsonArrayFindValue: v } };
            });
            return or.process({ key, value: andValue, statement });
        }

        return "`" + key + "` IN(" + value.map(item => statement.escape(item)).join(", ") + ")";
    }
};
export default inOperator;
