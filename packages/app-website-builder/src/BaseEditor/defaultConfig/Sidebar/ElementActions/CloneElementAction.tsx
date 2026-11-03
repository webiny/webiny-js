import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { DropdownMenu } from "@webiny/admin-ui";
import { ReactComponent as ContentCopyIcon } from "@webiny/icons/content_copy.svg";
import { useElementSidebar } from "../ElementSidebar/useElementSidebar.js";

export const CloneElementAction = createReactiveComponent(() => {
    const presenter = useElementSidebar();
    const { element } = presenter.vm;

    if (element && !element.actions.clone) {
        return null;
    }

    return (
        <DropdownMenu.Item
            icon={<ContentCopyIcon />}
            text={"Clone"}
            onClick={() => presenter.cloneElement()}
        />
    );
});
