import React from "react";
import { ReactComponent as CloseIcon } from "@material-design-icons/svg/round/close.svg";

import { DrawerContent, DrawerHeader } from "@webiny/ui/Drawer";
import { IconButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";

import { Content } from "~/components/AdvancedSearch/styled";

import { Field } from "./types";
import Form from "~/components/AdvancedSearch/Form";

interface DrawerProps {
    open: boolean;
    onClose: () => void;
    fields: Field[];
}

export const Drawer: React.VFC<DrawerProps> = ({ open, onClose, fields }) => {
    if (!open) {
        return null;
    }

    return (
        <Content modal open={open} onClose={onClose} dir="ltr">
            <DrawerHeader>
                <Typography use={"headline6"}>Search details</Typography>
                <IconButton icon={<CloseIcon />} onClick={onClose} />
            </DrawerHeader>
            <DrawerContent dir="ltr">
                <Form fields={fields} />
            </DrawerContent>
        </Content>
    );
};
