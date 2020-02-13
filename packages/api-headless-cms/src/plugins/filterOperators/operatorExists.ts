export default {
    name: "cms-find-filter-operator-exists",
    type: "cms-find-filter-operator",
    operator: "exists",
    createCondition({ value, context }) {
        // TODO: not sure if `cmsManage` needs this operator...

        return value
            ? {
                  $elemMatch: {
                      locale: context.cms.locale.id
                  }
              }
            : { $not: { $elemMatch: { locale: context.cms.locale.id } } };
    }
};
