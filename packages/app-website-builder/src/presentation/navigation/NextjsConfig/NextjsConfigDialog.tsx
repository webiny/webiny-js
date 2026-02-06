import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
// @ts-expect-error Remove this one moduleResolution is set to `bundler`
import { compiler } from "markdown-to-jsx/react";
import { Dialog, OverlayLoader } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import { NextjsConfigFeature } from "~/presentation/navigation/NextjsConfig/feature.js";
import { markdownComponents } from "~/presentation/navigation/NextjsConfig/markdownComponents.js";

interface IStartDialogProps {
    open: boolean;
    onClose: () => void;
}

export const NexjsConfigDialog = observer((props: IStartDialogProps) => {
    const { open, onClose } = props;

    const { presenter } = useFeature(NextjsConfigFeature);

    useEffect(() => {
        if (open) {
            presenter.init();
        }
    }, [open]);

    const vm = presenter.vm;
    const loading = vm.loading;

    return (
        <Dialog
            open={open}
            size={loading ? "md" : "xl"}
            onOpenChange={onClose}
            title={"Configure Next.js"}
            actions={<Dialog.CancelAction text={"Close"} />}
            showCloseButton={true}
            dismissible={true}
        >
            {loading ? (
                <div className={"relative"} style={{ height: 80 }}>
                    <OverlayLoader text={"Loading config..."} />
                </div>
            ) : null}
            {loading ? null : <>{compiler(vm.config, { overrides: markdownComponents })}</>}
        </Dialog>
    );
});
