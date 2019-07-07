import { ObjectId } from "mongodb";

export default {
    name: "cms-headless-filter-operator-not",
    type: "cms-headless-filter-operator",
    operator: "not",
    createCondition({ fieldId, value, context }) {
        if (fieldId === "_id") {
            return { $ne: ObjectId(value) };
        }

        if (context.cms.headlessManage) {
            return { $elemMatch: { value: { $ne: value } } };
        }

        return { $elemMatch: { value: { $ne: value }, locale: context.locale } };
    }
};
