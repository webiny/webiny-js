import { observable, toJS } from "mobx";
import React, { useCallback, useState } from "react";
import { IconButton } from "@webiny/admin-ui";
import { useHotkeys } from "@webiny/app-admin";
import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import { useFeature } from "@webiny/app";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { useSelectFromDocument } from "~/BaseEditor/hooks/useSelectFromDocument.js";
import { PageSettingsFeature } from "~/presentation/pages/PageEditor/PageSettings/feature.js";
import { PageSettingsDrawer } from "./PageSettingsDrawer.js";
import { PageSettingsGroup } from "~/presentation/pages/PageEditor/PageSettings/index.js";

export const SettingsButton = () => {
    const editor = useDocumentEditor();
    const { presenter } = useFeature(PageSettingsFeature);
    const [isOverlayOpen, setOverlayOpen] = useState(false);

    const formData = useSelectFromDocument(document => {
        return structuredClone({
            properties: toJS(document.properties),
            metadata: toJS(document.metadata),
            extensions: toJS(document.extensions)
        }) as PageSettingsGroup.PageDocument;
    });

    const openOverlay = useCallback(() => {
        presenter.init(formData);
        setOverlayOpen(true);
    }, [formData]);

    const closeOverlay = useCallback(() => {
        setOverlayOpen(false);
    }, []);

    const saveSettings = useCallback(async () => {
        const result = await presenter.submit();
        if (result) {
            editor.updateDocument(document => {
                document.properties = observable(result.properties);
                document.metadata = observable(result.metadata);
                document.extensions = observable(result.extensions);
            });
            closeOverlay();
        }
    }, []);

    useHotkeys({
        zIndex: 55,
        disabled: !isOverlayOpen,
        keys: {
            esc: closeOverlay
        }
    });

    return (
        <div className={"flex gap-x-sm"}>
            <IconButton variant="ghost" icon={<SettingsIcon />} onClick={openOverlay} />
            <PageSettingsDrawer
                presenter={presenter}
                open={isOverlayOpen}
                onClose={closeOverlay}
                onSave={saveSettings}
            />
        </div>
    );
};
