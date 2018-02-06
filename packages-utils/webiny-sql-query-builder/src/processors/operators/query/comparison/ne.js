// @flow
import _ from "lodash";

const ne: Operator = {
    canProcess: ({ value }) => {
        return _.has(value, "$ne");
    },
    process: ({ key, value, processor }) => {
        if (value["$ne"] === null) {
            return key + " IS NOT NULL";
        }

        return key + " <> " + processor.escape(value["$ne"]);
    }
};
export default ne;
