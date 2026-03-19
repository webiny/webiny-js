import { observable, toJS } from "mobx";
import React, { useCallback, useState } from "react";
import { IconButton } from "@webiny/admin-ui";
import { useHotkeys } from "@webiny/app-admin";
import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import type { GenericFormData } from "@webiny/form";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { useSelectFromDocument } from "~/BaseEditor/hooks/useSelectFromDocument.js";
import { useEditorConfig } from "~/BaseEditor/index.js";
import { PageSettingsDrawer } from "./Settings/PageSettingsDrawer.js";
import { PageSettingsDialog } from "./Settings/PageSettingsDialog.js";

export interface PageSettingsOverlayProps {
    open: boolean;
    data: Record<string, any>;
    onClose: () => void;
    onSave: (data: Record<string, any>) => void;
}

export const SettingsButton = () => {
    const editor = useDocumentEditor();
    const { pageSettings } = useEditorConfig();
    const [isOverlayOpen, setOverlayOpen] = useState(false);

    const openOverlay = useCallback(() => {
        setOverlayOpen(() => true);
    }, []);

    const closeOverlay = useCallback(() => {
        setOverlayOpen(() => false);
    }, []);

    const saveSettings = useCallback((data: GenericFormData) => {
        editor.updateDocument(document => {
            document.properties = observable(data.properties);
            document.metadata = observable(data.metadata);
            document.extensions = observable(data.extensions);
        });
        closeOverlay();
    }, []);

    const formData = useSelectFromDocument(document => {
        return structuredClone({
            properties: toJS(document.properties),
            metadata: toJS(document.metadata),
            extensions: toJS(document.extensions)
        });
    });

    useHotkeys({
        zIndex: 55,
        disabled: !isOverlayOpen,
        keys: {
            esc: closeOverlay
        }
    });

    const props: PageSettingsOverlayProps = {
        open: isOverlayOpen,
        onClose: closeOverlay,
        data: formData,
        onSave: saveSettings
    };

    return (
        <div className={"flex gap-x-sm"}>
            <IconButton variant="secondary" icon={<SettingsIcon />} onClick={openOverlay} />
            {pageSettings.viewMode === "dialog" ? <PageSettingsDialog {...props} /> : null}
            {pageSettings.viewMode === "drawer" ? <PageSettingsDrawer {...props} /> : null}
        </div>
    );
};
