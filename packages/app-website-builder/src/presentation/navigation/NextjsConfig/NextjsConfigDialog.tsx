import React, { useCallback, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { compiler } from "markdown-to-jsx/react";
import { Dialog, OverlayLoader, Select } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import { NextjsConfigFeature } from "~/presentation/navigation/NextjsConfig/feature.js";
import { markdownComponents } from "~/presentation/navigation/NextjsConfig/markdownComponents.js";
import {
    STARTER_KIT_FRAMEWORKS,
    StarterKitFramework
} from "~/presentation/navigation/NextjsConfig/abstractions.js";

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

    const onFrameworkChange = useCallback(
        (value: string) => {
            presenter.setFramework(value as StarterKitFramework);
        },
        [presenter]
    );

    return (
        <Dialog
            open={open}
            size={loading ? "md" : "xl"}
            onOpenChange={onClose}
            title={"Configure Starter Kit"}
            actions={<Dialog.CancelAction text={"Close"} />}
            showCloseButton={true}
            dismissible={true}
        >
            {loading ? (
                <div className={"relative"} style={{ height: 80 }}>
                    <OverlayLoader text={"Loading config..."} />
                </div>
            ) : null}
            {loading ? null : (
                <>
                    <div className={"mb-4"}>
                        <Select
                            label={"Framework"}
                            value={vm.framework}
                            options={STARTER_KIT_FRAMEWORKS}
                            onChange={onFrameworkChange}
                        />
                    </div>
                    {compiler(vm.config, { overrides: markdownComponents })}
                </>
            )}
        </Dialog>
    );
});
