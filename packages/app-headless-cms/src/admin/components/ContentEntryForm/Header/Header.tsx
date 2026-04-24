import React from "react";
import { Helmet } from "react-helmet";
import { Buttons, makeDecoratable } from "@webiny/app-admin";
import { useContentEntryEditorConfig } from "~/admin/config/contentEntries/index.js";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/index.js";

export const Header = makeDecoratable("ContentEntryFormHeader", () => {
    const { buttonActions } = useContentEntryEditorConfig();
    const { entry } = useContentEntry();

    return (
        <div
            className={
                "flex items-center justify-between gap-sm border-b-sm border-neutral-dimmed pb-md mb-md"
            }
            id="headerToolbarGrid"
        >
            {entry.meta?.title ? <Helmet title={entry.meta.title} /> : null}
            <div className={"flex items-center gap-sm"}>
                <Buttons actions={buttonActions} />
            </div>
        </div>
    );
});
