import React, { useEffect } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { compiler } from "markdown-to-jsx/react";
import { Button, Dialog, Input, OverlayLoader, Tabs } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import { StarterKitConfigFeature } from "./feature.js";
import { markdownComponents } from "./markdownComponents.js";

interface Props {
    open: boolean;
    onClose: () => void;
}

const TabContent = createReactiveComponent(({ config }: { config: string }) => {
    return <>{compiler(config, { overrides: markdownComponents })}</>;
});

export const StarterKitConfigDialog = createReactiveComponent(({ open, onClose }: Props) => {
    const { presenter } = useFeature(StarterKitConfigFeature);

    useEffect(() => {
        if (open) {
            presenter.init();
        }
    }, [open]);

    const { loading, saving, domain, starterKits } = presenter.vm;

    const tabs = starterKits.map(kit => (
        <Tabs.Tab
            key={kit.id}
            trigger={kit.label}
            value={kit.id}
            content={<TabContent config={kit.config} />}
        />
    ));

    return (
        <Dialog
            open={open}
            size={"xl"}
            bodyPadding={false}
            onOpenChange={onClose}
            title={"Configure Frontend"}
            actions={
                <>
                    <Dialog.CancelAction text={"Close"} />
                    <Button
                        text={saving ? "Saving..." : "Save"}
                        variant={"primary"}
                        disabled={saving}
                        onClick={() => presenter.save()}
                    />
                </>
            }
            showCloseButton={true}
            dismissible={true}
        >
            <div className={"relative"} style={{ minHeight: 160 }}>
                <div className={"p-md"}>
                    <Input
                        label={"Frontend Domain"}
                        description={"The domain where your frontend application is hosted."}
                        value={domain}
                        onChange={value => presenter.setDomain(value ?? "")}
                    />
                </div>
                <Tabs
                    tabs={tabs}
                    defaultValue={starterKits[0]?.id}
                    size={"md"}
                    spacing={"lg"}
                    separator={true}
                />
                {loading ? <OverlayLoader text={"Loading config..."} /> : null}
                {saving ? <OverlayLoader text={"Saving..."} /> : null}
            </div>
        </Dialog>
    );
});
