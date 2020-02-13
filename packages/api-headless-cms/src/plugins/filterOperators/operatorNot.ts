import { ObjectId } from "mongodb";

export default {
    name: "cms-find-filter-operator-not",
    type: "cms-find-filter-operator",
    operator: "not",
    createCondition({ fieldId, value, context }) {
        if (fieldId === "id") {
            return { $ne: ObjectId(value) };
        }

        if (context.cms.manage) {
            return { $elemMatch: { value: { $ne: value } } };
        }

        return { $elemMatch: { value: { $ne: value }, locale: context.cms.locale.id } };
    }
};
