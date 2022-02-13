import React from "react";
import { AccordionItem } from "@webiny/ui/Accordion";
import { AdminAppPermissionRendererPlugin } from "@webiny/app-admin/types";
import { ReactComponent as HeadlessCMSIcon } from "../../icons/devices_other-black-24px.svg";
import { CMSPermissions } from "./CmsPermissions";

const plugin: AdminAppPermissionRendererPlugin = {
    type: "admin-app-permissions-renderer",
    name: "admin-app-permissions-renderer-cms",
    render(props) {
        return (
            <AccordionItem
                icon={<HeadlessCMSIcon />}
                title={"Headless CMS"}
                description={"Manage Headless CMS app access permissions."}
                data-testid={"permission.cms"}
            >
                <CMSPermissions {...props} />
            </AccordionItem>
        );
    }
};
export default plugin;
