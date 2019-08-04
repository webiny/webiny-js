import { ObjectId } from "mongodb";

export default {
    name: "cms-headless-filter-operator-in",
    type: "cms-headless-filter-operator",
    operator: "in",
    createCondition({ fieldId, value, context }) {
        if (fieldId === "_id") {
            return { $in: value.map(ObjectId) };
        }

        if (context.cms.headlessManage) {
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
