// @flow
import _ from "lodash";
import type { Operator } from "../../../../../../types";

const inOperator: Operator = {
    canProcess: ({ key, value }) => {
        if (key.charAt(0) === "$") {
            return false;
        }

        return _.isArray(value) || _.has(value, "$in");
    },
    process: ({ key, value, processor }) => {
        value = _.get(value, "$in", value);
        return key + " IN(" + value.map(item => processor.escape(item)).join(", ") + ")";
    }
};
export default inOperator;
