import { ObjectId } from "mongodb";

export default {
    name: "cms-filter-operator-eq",
    type: "cms-filter-operator",
    operator: "eq",
    createCondition({ fieldId, value, context }) {
        if (fieldId === "_id") {
            return ObjectId(value);
        }

        if (context.cmsManage) {
            return { $elemMatch: { value } };
        }

        return { $elemMatch: { value, locale: context.locale } };
    }
};
