import React from "react";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as VisibilityIcon } from "@webiny/icons/visibility.svg";
import { ViewAsPicker } from "~/presentation/assumedRole/components/viewAsPicker/ViewAsPicker.js";
import { Command } from "../abstractions.js";

/**
 * Entry point for previewing the Admin as a role or team. It lives in the palette rather than in the
 * header: previewing is something you reach for while setting up permissions, not on a normal day,
 * so it doesn't earn permanent chrome.
 *
 * The picker is a second list rather than a form, so it takes over the whole panel and the row
 * reads "Choose".
 */
class ViewAsCommandImpl implements Command.Interface {
    name = "admin.viewAs";
    label = "View as role or team";
    description = "Browse the Admin with someone else's permissions";
    category = "Actions";
    keywords = ["role", "team", "permissions", "preview", "impersonate", "assume"];
    icon = <Icon icon={<VisibilityIcon />} size="sm" color="neutral-strong" label="" />;
    detailView = ViewAsPicker;
    detailViewOwnsPanel = true;
    verb = "Choose";
}

export const ViewAsCommand = Command.createImplementation({
    implementation: ViewAsCommandImpl,
    dependencies: []
});
