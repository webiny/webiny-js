import { ContextPlugin } from "@webiny/api";
import { FormBuilderContext } from "~/types";

/**
 * Form Builder is the last app that has an installer. Once its installation is finished,
 * we need to notify the system that tenant is now ready to use, because many external plugins
 * insert initial tenant data into various apps, copy data from other tenants, etc.
 *
 * To make this event as robust as possible, we want to manually fire it at the correct point in time.
 * At the time of writing, the correct point in time is after the Form Builder installation.
 */

export const onAfterInstall = () => {
    return new ContextPlugin<FormBuilderContext>(({ formBuilder, tenancy }) => {
        formBuilder.onSystemAfterInstall.subscribe(async () => {
            await tenancy.onTenantAfterInstall.publish({});
        });
    });
};
