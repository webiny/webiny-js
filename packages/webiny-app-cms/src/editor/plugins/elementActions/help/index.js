// @flow
import React from "react";
import { ReactComponent as HelpIcon } from "webiny-app-cms/editor/assets/icons/help_outline.svg";
import type { CmsElementActionPluginType } from "webiny-app-cms/types";

export default ({
    name: "pb-editor-element-action-help",
    type: "pb-editor-element-action",
    render({ plugin }) {
        return plugin.help ? <HelpIcon onClick={() => window.open(plugin.help, "_blank")} /> : null;
    }
}: CmsElementActionPluginType);
