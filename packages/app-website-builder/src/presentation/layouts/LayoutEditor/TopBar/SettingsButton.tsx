import React, { useState } from "react";
import { Alert, Dialog, IconButton } from "@webiny/admin-ui";
import { createReactiveComponent, FormView } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import type { LayoutEditorDocument } from "../layoutDocument.js";
import { LayoutPropertiesFeature } from "../Properties/feature.js";
import type { LayoutPropertiesPresenter } from "../Properties/abstractions.js";

interface LayoutSettingsDialogProps {
    presenter: LayoutPropertiesPresenter.Interface;
    onClose: () => void;
}

const LayoutSettingsDialog = createReactiveComponent(
    ({ presenter, onClose }: LayoutSettingsDialogProps) => {
        const editor = useDocumentEditor<LayoutEditorDocument>();
        const { form, saving, renameWarning } = presenter.vm;

        const save = async () => {
            const layout = await presenter.submit();
            if (!layout) {
                return;
            }

            editor.updateDocument(document => {
                document.properties.title = layout.properties.title;
                document.properties.slug = layout.properties.slug ?? null;
            });
            onClose();
        };

        return (
            <Dialog
                open={true}
                onClose={onClose}
                dismissible={!saving}
                loading={saving ? { text: "Saving layout settings..." } : undefined}
                title={"Layout settings"}
                actions={
                    <>
                        <Dialog.CancelAction onClick={onClose} text={"Cancel"} disabled={saving} />
                        <Dialog.ConfirmAction onClick={save} text={"Save"} disabled={saving} />
                    </>
                }
            >
                {form ? <FormView name={"Layout Settings"} form={form} /> : null}
                {renameWarning ? (
                    <Alert type={"warning"} className={"mt-md"}>
                        {renameWarning}
                    </Alert>
                ) : null}
            </Dialog>
        );
    }
);

// The layout's title and slug.
export const SettingsButton = () => {
    const editor = useDocumentEditor<LayoutEditorDocument>();
    const { presenter } = useFeature(LayoutPropertiesFeature);
    const [open, setOpen] = useState(false);

    const openDialog = () => {
        const document = editor.getDocumentState().read();
        presenter.init({
            id: document.id,
            title: document.properties.title ?? "",
            slug: document.properties.slug ?? null,
            isLanguageVersion: Boolean(document.properties.sourceLayout)
        });
        setOpen(true);
    };

    return (
        <>
            <IconButton
                variant={"ghost"}
                icon={<SettingsIcon />}
                onClick={openDialog}
                aria-label={"Layout settings"}
            />
            {open ? (
                <LayoutSettingsDialog presenter={presenter} onClose={() => setOpen(false)} />
            ) : null}
        </>
    );
};
