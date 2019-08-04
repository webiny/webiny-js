import { ObjectId } from "mongodb";

export default {
    name: "cms-headless-filter-operator-eq",
    type: "cms-headless-filter-operator",
    operator: "eq",
    createCondition({ fieldId, value, context }) {
        if (fieldId === "_id") {
            return ObjectId(value);
        }

        if (context.cms.headlessManage) {
            return { $elemMatch: { value } };
        }

        return { $elemMatch: { value, locale: context.locale } };
    }
};
