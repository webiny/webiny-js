// @flow
import _ from "lodash";
import type { Operator } from "../../../../types";

const or: Operator = {
    canProcess: ({ key }) => {
        return key === "$or";
    },
    process: ({ value, processor }) => {
        let output = "";
        switch (true) {
            case _.isArray(value):
                value.forEach(object => {
                    for (const [andKey, andValue] of Object.entries(object)) {
                        if (output === "") {
                            output = processor.process({ [andKey]: andValue });
                        } else {
                            output += " OR " + processor.process({ [andKey]: andValue });
                        }
                    }
                });
                break;
            case _.isPlainObject(value):
                for (const [andKey, andValue] of Object.entries(value)) {
                    if (output === "") {
                        output = processor.process({ [andKey]: andValue });
                    } else {
                        output += " OR " + processor.process({ [andKey]: andValue });
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
