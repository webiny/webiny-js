import React from "react";
import { AccordionItem } from "@webiny/ui/Accordion";
import { AdminAppPermissionRendererPlugin } from "@webiny/app-admin/types";
import { ReactComponent as HeadlessCMSIcon } from "@webiny/app-headless-cms/admin/icons/devices_other-black-24px.svg";

import { CmsPermissions } from "./components/CmsPermissions";

export default {
    type: "admin-app-permissions-renderer",
    name: "admin-app-permissions-renderer-cms",
    render({ id, ...props }) {
        return (
            <AccordionItem
                key={this.name}
                icon={<HeadlessCMSIcon />}
                title={"Headless CMS"}
                description={"Permissions for headless cms"}
            >
                {/* We use key to unmount the component */}
                <CmsPermissions key={id} {...props} />
            </AccordionItem>
        );
    }
} as AdminAppPermissionRendererPlugin;
