import { ObjectId } from "mongodb";

export default {
    name: "cms-filter-operator-in",
    type: "cms-filter-operator",
    operator: "in",
    createCondition({ fieldId, value, context }) {
        if (fieldId === "_id") {
            return { $in: value.map(ObjectId) };
        }

        if (context.cmsManage) {
            return { $elemMatch: { value: { $in: value } } };
        }

        return {
            $elemMatch: {
                value: { $in: value },
                locale: context.locale
            }
        };
    }
};
