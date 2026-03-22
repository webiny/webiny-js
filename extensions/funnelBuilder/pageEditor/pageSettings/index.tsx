import React from "react";
import { PageEditorConfig, useElementOverlay } from "webiny/admin/website-builder/page/editor";
import { ReactComponent as StarIcon } from "webiny/admin/icons/star.svg";
import { ReactComponent as EditIcon } from "webiny/admin/icons/edit.svg";
import { IconButton } from "webiny/admin/ui";

const { PageSettings, ElementOverlay } = PageEditorConfig;

const CustomOverlayAction = () => {
    const { elementId, componentManifest, isHighlighted } = useElementOverlay();

    if (!isHighlighted) {
        return null;
    }

    if (!componentManifest.name.startsWith("FunnelBuilder/")) {
        return null;
    }

    return (
        /* Add 32px which is the size of an IconButton. */
        <ElementOverlay.Element.Container position={{ top: 5, right: 5 + 32 }}>
            <IconButton
                icon={<EditIcon />}
                variant={"secondary"}
                onClick={() => console.log("edit", elementId)}
            />
        </ElementOverlay.Element.Container>
    );
};

export const FubPageSettings = () => {
    return (
        <PageEditorConfig>
            <ElementOverlay.Element name="editAction" element={<CustomOverlayAction />} />
            <PageSettings.ViewMode.Drawer />
            <PageSettings.Group
                name={"custom"}
                title={"Custom"}
                icon={<StarIcon />}
                description={"My super custom group"}
            >
                <PageSettings.Element name={"title"} element={<div>element</div>} />
            </PageSettings.Group>
        </PageEditorConfig>
    );
};
