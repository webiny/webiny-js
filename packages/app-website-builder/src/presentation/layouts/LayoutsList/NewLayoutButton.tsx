import React, { useState } from "react";
import { Button } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { CreateLayoutDialog } from "../CreateLayout/CreateLayoutDialog.js";

export const NewLayoutButton = () => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button text={"New layout"} icon={<AddIcon />} onClick={() => setOpen(true)} />
            {open ? <CreateLayoutDialog onClose={() => setOpen(false)} /> : null}
        </>
    );
};
