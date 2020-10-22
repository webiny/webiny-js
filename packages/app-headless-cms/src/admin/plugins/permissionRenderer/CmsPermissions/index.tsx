import React from "react";
import { AccordionItem } from "@webiny/ui/Accordion";
import { AdminAppPermissionRendererPlugin } from "@webiny/app-admin/types";
import { ReactComponent as HeadlessCMSIcon } from "@webiny/app-headless-cms/admin/icons/devices_other-black-24px.svg";
import { CMSPermissions } from "./CmsPermissions";

export default {
    type: "admin-app-permissions-renderer",
    name: "admin-app-permissions-renderer-cms",
    render(props) {
        return (
            <AccordionItem
                icon={<HeadlessCMSIcon />}
                title={"Headless CMS"}
                description={"Manage Headless CMS app access permissions."}
            >
                <CMSPermissions {...props} />
            </AccordionItem>
        );
    }
} as AdminAppPermissionRendererPlugin;
