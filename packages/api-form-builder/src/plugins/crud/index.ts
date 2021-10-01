import { FormBuilderContext } from "~/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { createSystemCrud } from "~/plugins/crud/system.crud";
import { createSettingsCrud } from "~/plugins/crud/settings.crud";
import { createFormsCrud } from "~/plugins/crud/forms.crud";

export default () => {
    return new ContextPlugin<FormBuilderContext>(async context => {
        const storageOperations: any = {};

        const tenant = context.tenancy.getCurrentTenant();
        const identity = context.security.getIdentity();
        const locale = context.i18nContent.getLocale();

        context.formBuilder = {
            storageOperations,
            ...createSystemCrud({
                identity,
                tenant,
                context
            }),
            ...createSettingsCrud({
                tenant,
                locale,
                context
            }),
            ...createFormsCrud({
                tenant,
                locale
            })
        };
    });
};
