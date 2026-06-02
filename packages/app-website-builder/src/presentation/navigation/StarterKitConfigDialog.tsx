import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { compiler } from "markdown-to-jsx/react";
import { Dialog, OverlayLoader, Tabs } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import { NextjsConfigFeature } from "~/presentation/navigation/NextjsConfig/feature.js";
import { NuxtConfigFeature } from "~/presentation/navigation/NuxtConfig/feature.js";
import { markdownComponents } from "~/presentation/navigation/NextjsConfig/markdownComponents.js";

interface Props {
    open: boolean;
    onClose: () => void;
}

const NextjsTabContent = observer(({ open }: { open: boolean }) => {
    const { presenter } = useFeature(NextjsConfigFeature);

    useEffect(() => {
        if (open) {
            presenter.init();
        }
    }, [open]);

    const { loading, config } = presenter.vm;

    if (loading) {
        return (
            <div className={"relative"} style={{ height: 80 }}>
                <OverlayLoader text={"Loading config..."} />
            </div>
        );
    }

    return <>{compiler(config, { overrides: markdownComponents })}</>;
});

const NuxtTabContent = observer(({ open }: { open: boolean }) => {
    const { presenter } = useFeature(NuxtConfigFeature);

    useEffect(() => {
        if (open) {
            presenter.init();
        }
    }, [open]);

    const { loading, config } = presenter.vm;

    if (loading) {
        return (
            <div className={"relative"} style={{ height: 80 }}>
                <OverlayLoader text={"Loading config..."} />
            </div>
        );
    }

    return <>{compiler(config, { overrides: markdownComponents })}</>;
});

export const StarterKitConfigDialog = ({ open, onClose }: Props) => {
    const tabs = [
        <Tabs.Tab
            key={"nextjs"}
            trigger={"Next.js"}
            value={"nextjs"}
            content={<NextjsTabContent open={open} />}
        />,
        <Tabs.Tab
            key={"nuxt"}
            trigger={"Nuxt"}
            value={"nuxt"}
            content={<NuxtTabContent open={open} />}
        />
    ];

    return (
        <Dialog
            open={open}
            size={"xl"}
            onOpenChange={onClose}
            title={"Configure Starter Kit"}
            actions={<Dialog.CancelAction text={"Close"} />}
            showCloseButton={true}
            dismissible={true}
        >
            <Tabs tabs={tabs} size={"md"} spacing={"sm"} />
        </Dialog>
    );
};
