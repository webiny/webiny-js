import React from "react";
import { CmsProvider } from "@webiny/app-headless-cms/admin/contexts/Cms";
import { AppTemplateRendererPlugin } from "@webiny/app-template/types";

const plugins: AppTemplateRendererPlugin[] = [
    {
        type: "app-template-renderer",
        name: "app-template-renderer-headless-cms",
        render(children) {
            return <CmsProvider>{children}</CmsProvider>;
        }
    }
];

export default plugins;
