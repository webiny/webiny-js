export default {
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
};
