import React from "react";
import { Button } from "@webiny/admin-ui";
import { i18n } from "@webiny/app/i18n/index.js";
import { ReactComponent as Plus } from "@webiny/icons/add.svg";
import { useCreateDialog } from "~/dialogs/index.js";

type ButtonCreateProps = {
    disabled?: boolean;
    onCreateFolder?: () => void;
};

const t = i18n.ns("app-aco/components/folder-tree/button-create");

export const ButtonCreate = (props: ButtonCreateProps) => {
    const { showDialog } = useCreateDialog();

    const handleClick = () => {
        if (props.onCreateFolder) {
            props.onCreateFolder();
        } else {
            showDialog();
        }
    };

    return (
        <Button
            onClick={handleClick}
            disabled={props.disabled}
            icon={<Plus />}
            text={t`New folder`}
            variant={"secondary"}
            size={"sm"}
        />
    );
};
