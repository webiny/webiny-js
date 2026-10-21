import React, { useEffect } from "react";
import { Select } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import { createReactiveComponent } from "@webiny/app-admin";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import type { LayoutEditorDocument } from "../layoutDocument.js";
import { LayoutPreviewPageFeature } from "./feature.js";

/**
 * Pick a page to preview the layout with. The page isn't saved with the layout.
 */
export const PreviewPagePicker = createReactiveComponent(() => {
    const editor = useDocumentEditor<LayoutEditorDocument>();
    const { presenter } = useFeature(LayoutPreviewPageFeature);

    useEffect(() => presenter.init(editor), [presenter, editor]);

    const { options, selectedPageId } = presenter.vm;

    return (
        <div className={"w-[260px]"}>
            <Select
                size={"md"}
                placeholder={"Preview with page..."}
                value={selectedPageId ?? ""}
                options={options}
                // Resetting the select changes its value to "".
                onChange={value => void presenter.select(value || null)}
                displayResetAction={Boolean(selectedPageId)}
            />
        </div>
    );
});
