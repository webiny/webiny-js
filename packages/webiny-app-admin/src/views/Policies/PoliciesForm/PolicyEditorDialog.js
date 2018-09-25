// @flow
import * as React from "react";
import {
    Dialog,
    DialogAccept,
    DialogFooter,
    DialogHeader,
    DialogHeaderTitle,
    DialogBody
} from "webiny-ui/Dialog";

import { i18n } from "webiny-app/i18n";
const t = i18n.namespace("Security.PoliciesForm.FullScreenEditorDialog");

const PolicyEditorDialog = (props: { children: React.Node }) => {
    return (
        <Dialog {...props}>
            <DialogHeader>
                <DialogHeaderTitle>{t`Policy Editor`}</DialogHeaderTitle>
            </DialogHeader>
            <DialogBody>{props.children}</DialogBody>
            <DialogFooter>
                <DialogAccept onClick={() => console.log("Accept")}>{t`Close`}</DialogAccept>
            </DialogFooter>
        </Dialog>
    );
};

export default PolicyEditorDialog;
