import React, { useCallback } from "react";
import { Snackbar } from "@webiny/ui/Snackbar";
import get from "lodash/get";
import { useUi } from "@webiny/app/hooks/useUi";

const SnackbarMain: React.FC = () => {
    const ui = useUi();
    const message: React.ReactNode = get(ui, "snackbar.message");
    const options: Record<string, any> = get(ui, "snackbar.options", {});

    const hideSnackbar = useCallback((): void => {
        ui.setState(ui => ({ ...ui, snackbar: null }));
    }, [ui]);

    return <Snackbar open={!!message} onClose={hideSnackbar} message={message} {...options} />;
};

export default SnackbarMain;
