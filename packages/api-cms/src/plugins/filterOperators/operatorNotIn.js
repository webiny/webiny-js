import { ObjectId } from "mongodb";

export default {
    name: "cms-filter-operator-not-in",
    type: "cms-filter-operator",
    operator: "not_in",
    createCondition({ fieldId, value, context }) {
        if (fieldId === "_id") {
            return { $nin: value.map(ObjectId) };
        }

        if (context.cmsManage) {
            return { $elemMatch: { value: { $nin: value } } };
        }

        return {
            $elemMatch: {
                value: { $nin: value },
                locale: context.locale
            }
        };
    }
};
