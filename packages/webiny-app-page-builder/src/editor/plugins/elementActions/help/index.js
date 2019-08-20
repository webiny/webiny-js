// @flow
import React from "react";
import { ReactComponent as HelpIcon } from "webiny-app-page-builder/editor/assets/icons/help_outline.svg";
import type { PbElementActionPluginType } from "webiny-app-page-builder/types";

export default ({
    name: "pb-editor-element-action-help",
    type: "pb-editor-element-action",
    render({ plugin }) {
        return plugin.help ? <HelpIcon onClick={() => window.open(plugin.help, "_blank")} /> : null;
    }
}: PbElementActionPluginType);
