import React, { useEffect } from "react";
import { AccordionItem } from "@webiny/ui/Accordion";
import { AdminAppPermissionRendererPlugin } from "@webiny/app-admin/types";
import { ReactComponent as ApwIcon } from "~/assets/icons/account_tree_24dp.svg";
import { ApwPermissions as ApwPermissionsComponent } from "./ApwPermissions";
import { plugins } from "@webiny/plugins";

const createPermissions = (): AdminAppPermissionRendererPlugin => {
    return {
        type: "admin-app-permissions-renderer",
        name: "admin-app-permissions-renderer-apw",
        render(props) {
            return (
                <AccordionItem
                    icon={<ApwIcon />}
                    title={"Advanced Publishing Workflow"}
                    description={"Manage Advanced Publishing Workflow app access permissions."}
                    data-testid={"permission.apw"}
                >
                    <ApwPermissionsComponent {...props} />
                </AccordionItem>
            );
        }
    };
};

export const ApwPermissions = () => {
    useEffect(() => {
        plugins.register(createPermissions());
    }, []);
    return null;
};
