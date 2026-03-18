import React from "react";
import {PageEditorConfig} from "@webiny/app-website-builder/exports/admin/website-builder/page/editor.js"
import {HasPermission} from "@webiny/app-website-builder/presentation/security/HasPermission.js";

export const SchedulerPageEditorConfig = () => {
    return <PageEditorConfig>
        <HasPermission entity={"page"} action={"publish"}>
        <>a</>
        </HasPermission>
    </PageEditorConfig>
}
