import { ObjectId } from "mongodb";

export default [
    {
        name: "cms-headless-filter-operator-eq",
        type: "cms-headless-filter-operator",
        operator: "eq",
        createCondition({ fieldId, field, value, context }) {
            if (fieldId === "_id") {
                value = ObjectId(value);
            }

            if (field && field.i18n) {
                return { $elemMatch: { value, locale: context.locale } };
            }

            return value;
        }
    },
    {
        name: "cms-headless-filter-operator-not",
        type: "cms-headless-filter-operator",
        operator: "not",
        createCondition({ fieldId, field, value, context }) {
            if (fieldId === "_id") {
                value = ObjectId(value);
            }

            if (field && field.i18n) {
                return { $elemMatch: { value: { $ne: value }, locale: context.locale } };
            }

            return { $ne: value };
        }
    },
    {
        name: "cms-headless-filter-operator-exists",
        type: "cms-headless-filter-operator",
        operator: "exists",
        createCondition({ value, field, context }) {
            if (field && field.i18n) {
                return value
                    ? {
                          $elemMatch: {
                              locale: context.locale
                          }
                      }
                    : { $not: { $elemMatch: { locale: context.locale } } };
            }

            return { $exists: value };
        }
    },
    {
        name: "cms-headless-filter-operator-in",
        type: "cms-headless-filter-operator",
        operator: "in",
        createCondition({ fieldId, field, value, context }) {
            if (fieldId === "_id") {
                value = value.map(ObjectId);
            }

            if (field && field.i18n) {
                return {
                    $elemMatch: {
                        value: { $in: value },
                        locale: context.locale
                    }
                };
            }

            return { $in: value };
        }
    },
    {
        name: "cms-headless-filter-operator-not-in",
        type: "cms-headless-filter-operator",
        operator: "not_in",
        createCondition({ fieldId, field, value, context }) {
            if (fieldId === "_id") {
                value = value.map(ObjectId);
            }

            if (field && field.i18n) {
                return {
                    $elemMatch: {
                        value: { $nin: value },
                        locale: context.locale
                    }
                };
            }

            return { $nin: value };
        }
    },
    {
        name: "cms-headless-filter-operator-contains",
        type: "cms-headless-filter-operator",
        operator: "contains",
        createCondition({ value, field, context }) {
            if (field && field.i18n) {
                return {
                    $elemMatch: {
                        value: { $regex: `.*${value}.*`, $options: "i" },
                        locale: context.locale
                    }
                };
            }

            return { $regex: `.*${value}.*`, $options: "i" };
        }
    },
    {
        name: "cms-headless-filter-operator-not-contains",
        type: "cms-headless-filter-operator",
        operator: "not_contains",
        createCondition({ value, field, context }) {
            if (field && field.i18n) {
                return {
                    $not: {
                        $elemMatch: {
                            value: { $regex: `.*${value}.*`, $options: "i" },
                            locale: context.locale
                        }
                    }
                };
            }

            return { $not: { $regex: `.*${value}.*`, $options: "i" } };
        }
    }
];
