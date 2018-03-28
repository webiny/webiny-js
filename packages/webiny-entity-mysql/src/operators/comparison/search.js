// @flow
import type { Operator } from "../../../types";
import or from "../logical/or";
import and from "../logical/and";

const search: Operator = {
    canProcess: ({ key }) => {
        return key === "$search";
    },
    process: ({ value, statement }) => {
        const columns = value.columns.map(columns => {
            return { [columns]: { $like: "%" + value.query + "%" } };
        });

        if (value.operator === "and") {
            return and.process({ key: "$and", value: columns, statement });
        }
        return or.process({ key: "$or", value: columns, statement });
    }
};

export default search;
