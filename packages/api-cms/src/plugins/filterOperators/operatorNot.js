import { ObjectId } from "mongodb";

export default {
    name: "cms-filter-operator-not",
    type: "cms-filter-operator",
    operator: "not",
    createCondition({ fieldId, value, context }) {
        if (fieldId === "_id") {
            return { $ne: ObjectId(value) };
        }

        if (context.cmsManage) {
            return { $elemMatch: { value: { $ne: value } } };
        }

        return { $elemMatch: { value: { $ne: value }, locale: context.locale } };
    }
};
