import React from "react";
import { PageEditorTopBar } from "./PageEditorTopBar.js";
import { PageEditorLayout } from "./PageEditorLayout.js";
import { PageNewRevisionDecorator } from "./PageNewRevisionDecorator.js";

export const PageEditorConfig = () => {
    return (
        <>
            {/* The review bar under the top bar, for every page status. */}
            <PageEditorTopBar />
            {/* The one source of the canvas read-only flag. */}
            <PageEditorLayout />
            {/* New Revision hidden while a review is in progress or its state is unknown. */}
            <PageNewRevisionDecorator />
        </>
    );
};
