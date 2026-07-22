import React from "react";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as CopyIcon } from "@webiny/icons/content_copy.svg";
import { Command } from "../abstractions.js";

class CopyCurrentUrlCommandImpl implements Command.Interface {
    name = "admin.copyCurrentUrl";
    label = "Copy current URL";
    description = "Copy this page's link to the clipboard";
    category = "Actions";
    keywords = ["clipboard", "share", "link"];
    icon = <Icon icon={<CopyIcon />} size="sm" color="neutral-strong" label="" />;

    execute() {
        void navigator.clipboard?.writeText(window.location.href);
    }
}

export const CopyCurrentUrlCommand = Command.createImplementation({
    implementation: CopyCurrentUrlCommandImpl,
    dependencies: []
});
