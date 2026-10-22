import React from "react";
import { observer } from "mobx-react-lite";
import { DropdownMenu } from "@webiny/admin-ui";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { useElementSidebar } from "../ElementSidebar/useElementSidebar.js";

export const DeleteElementAction = observer(() => {
    const presenter = useElementSidebar();
    const { element } = presenter.vm;

    if (element && !element.actions.delete) {
        return null;
    }

    return (
        <DropdownMenu.Item
            className={"text-destructive-primary [&_svg]:fill-destructive"}
            icon={<DeleteIcon />}
            text={"Delete"}
            onClick={() => presenter.deleteElement()}
        />
    );
});
