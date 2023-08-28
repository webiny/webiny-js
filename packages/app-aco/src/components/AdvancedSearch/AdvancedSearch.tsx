import React, { useState } from "react";
import { ReactComponent as CloseIcon } from "@material-design-icons/svg/round/close.svg";

import { DrawerContent, DrawerHeader } from "@webiny/ui/Drawer";
import { ButtonPrimary, IconButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";

import { Drawer } from "~/components/AdvancedSearch/styled";

import { Field } from "./types";
import Form from "~/components/AdvancedSearch/Form";

interface AdvancedSearchProps {
    fields: Field[];
}

export const AdvancedSearch: React.VFC<AdvancedSearchProps> = ({ fields }) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Drawer modal open={open} onClose={() => setOpen(false)} dir="rtl">
                <DrawerHeader dir="ltr">
                    <Typography use={"headline6"}>Search details</Typography>
                    <IconButton icon={<CloseIcon />} onClick={() => setOpen(false)} />
                </DrawerHeader>
                <DrawerContent dir="ltr">
                    <Form fields={fields} />
                </DrawerContent>
            </Drawer>

            <ButtonPrimary onClick={() => setOpen(!open)}>Create new search filter</ButtonPrimary>
        </>
    );
};
