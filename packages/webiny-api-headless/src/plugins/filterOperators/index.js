import { ObjectId } from "mongodb";

export default [
    {
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
    },
    {
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
    },
    {
        name: "cms-headless-filter-operator-exists",
        type: "cms-headless-filter-operator",
        operator: "exists",
        createCondition({ value, context }) {
            // TODO: not sure if `headlessManage` needs this operator...

            return value
                ? {
                      $elemMatch: {
                          locale: context.locale
                      }
                  }
                : { $not: { $elemMatch: { locale: context.locale } } };
        }
    },
    {
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
    },
    {
        name: "cms-headless-filter-operator-not-in",
        type: "cms-headless-filter-operator",
        operator: "not_in",
        createCondition({ fieldId, value, context }) {
            if (fieldId === "_id") {
                return { $nin: value.map(ObjectId) };
            }

            if (context.cms.headlessManage) {
                return { $elemMatch: { value: { $nin: value } } };
            }

            return {
                $elemMatch: {
                    value: { $nin: value },
                    locale: context.locale
                }
            };
        }
    },
    {
        name: "cms-headless-filter-operator-contains",
        type: "cms-headless-filter-operator",
        operator: "contains",
        createCondition({ value, context }) {
            if (context.cms.headlessManage) {
                return { $elemMatch: { value: { $regex: `.*${value}.*`, $options: "i" } } };
            }

            return {
                $elemMatch: {
                    value: { $regex: `.*${value}.*`, $options: "i" },
                    locale: context.locale
                }
            };
        }
    },
    {
        name: "cms-headless-filter-operator-not-contains",
        type: "cms-headless-filter-operator",
        operator: "not_contains",
        createCondition({ value, context }) {
            if (context.cms.headlessManage) {
                return {
                    $not: { $elemMatch: { value: { $regex: `.*${value}.*`, $options: "i" } } }
                };
            }

            return {
                $not: {
                    $elemMatch: {
                        value: { $regex: `.*${value}.*`, $options: "i" },
                        locale: context.locale
                    }
                }
            };
        }
    }
];
