// @flow
import _ from "lodash";
import type { Operator } from "../../../types";
import and from "./../logical/and";

const all: Operator = {
    canProcess: ({ key, value }) => {
        if (key.charAt(0) === "$") {
            return false;
        }

        return _.has(value, "$all");
    },
    process: ({ key, value, statement }) => {
        const andValue = value["$all"].map(v => {
            return { [key]: { $jsonArrayFindValue: v } };
        });
        return and.process({ key, value: andValue, statement });
    }
};

export default all;
