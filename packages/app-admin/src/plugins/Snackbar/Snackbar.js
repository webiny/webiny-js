// @flow
import React, { useCallback } from "react";
import { Snackbar } from "@webiny/ui/Snackbar";
import { get } from "lodash";
import { useUi } from "@webiny/app/hooks/useUi";

const SnackbarMain = () => {
    const ui = useUi();
    const message = get(ui, "snackbar.message");
    const options = get(ui, "snackbar.options", {});

    const hideSnackbar = useCallback(() => {
        ui.setState(ui => ({ ...ui, snackbar: null }));
    }, [ui]);

    return <Snackbar open={!!message} onClose={hideSnackbar} message={message} {...options} />;
};

export default SnackbarMain;
