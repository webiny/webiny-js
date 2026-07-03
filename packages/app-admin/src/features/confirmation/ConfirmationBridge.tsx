import { useEffect } from "react";
import { useContainer } from "@webiny/app";
import { useDialogs } from "~/components/Dialogs/useDialogs.js";
import { NamedDialogOpener } from "./abstractions.js";

export const ConfirmationBridge = () => {
    const container = useContainer();
    const { openNamedDialog } = useDialogs();

    useEffect(() => {
        container.registerInstance(NamedDialogOpener, {
            open: openNamedDialog
        });
    }, [container, openNamedDialog]);

    return null;
};
