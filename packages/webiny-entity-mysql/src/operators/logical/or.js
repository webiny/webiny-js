// @flow
import _ from "lodash";
import type { Operator } from "../../../types";

const or: Operator = {
    canProcess: ({ key }) => {
        return key === "$or";
    },
    process: ({ value, statement }) => {
        let output = "";
        switch (true) {
            case _.isArray(value):
                value.forEach(object => {
                    for (const [orKey, orValue] of Object.entries(object)) {
                        if (output === "") {
                            output = statement.process({ [orKey]: orValue });
                        } else {
                            output += " OR " + statement.process({ [orKey]: orValue });
                        }
                    }
                });
                break;
            case _.isPlainObject(value):
                for (const [orKey, orValue] of Object.entries(value)) {
                    if (output === "") {
                        output = statement.process({ [orKey]: orValue });
                    } else {
                        output += " OR " + statement.process({ [orKey]: orValue });
                    }
                }
                break;
            default:
                throw Error("$or operator must receive an object or an array.");
        }

        return "(" + output + ")";
    }
};

export default or;
