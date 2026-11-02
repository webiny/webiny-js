import React, { useEffect } from "react";
import { AutoCompletePrimitive } from "@webiny/admin-ui";
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

    const { options, selected, searching } = presenter.vm;

    return (
        <div className={"w-[260px]"}>
            <AutoCompletePrimitive
                size={"md"}
                label={"Preview with page"}
                placeholder={"Preview with page..."}
                value={selected?.value ?? ""}
                options={options}
                // The pages are searched on the server, by more than their label.
                shouldFilter={false}
                loading={searching}
                loadingMessage={"Searching pages..."}
                emptyMessage={"No pages found."}
                initialMessage={"No pages yet."}
                onValueSearch={term => void presenter.search(term)}
                // Resetting the field changes its value to "".
                onValueChange={value => void presenter.select(value || null)}
                displayResetAction={Boolean(selected)}
            />
        </div>
    );
});
