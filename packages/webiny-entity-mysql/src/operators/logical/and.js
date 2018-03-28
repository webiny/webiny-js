// @flow
import _ from "lodash";
import type { Operator } from "../../../types";

const and: Operator = {
    canProcess: ({ key }) => {
        return key === "$and";
    },
    process: ({ value, statement }) => {
        let output = "";
        switch (true) {
            case _.isArray(value):
                value.forEach(object => {
                    for (const [andKey, andValue] of Object.entries(object)) {
                        if (output === "") {
                            output = statement.process({ [andKey]: andValue });
                        } else {
                            output += " AND " + statement.process({ [andKey]: andValue });
                        }
                    }
                });
                break;
            case _.isPlainObject(value):
                for (const [andKey, andValue] of Object.entries(value)) {
                    if (output === "") {
                        output = statement.process({ [andKey]: andValue });
                    } else {
                        output += " AND " + statement.process({ [andKey]: andValue });
                    }
                }
                break;
            default:
                throw Error("$and operator must receive an object or an array.");
        }

        return "(" + output + ")";
    }
};

export default and;
