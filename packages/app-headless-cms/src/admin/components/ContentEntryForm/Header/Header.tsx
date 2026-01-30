import React from "react";
import { Buttons, makeDecoratable } from "@webiny/app-admin";

import { useContentEntryEditorConfig } from "~/admin/config/contentEntries/index.js";

import { ContentFormOptionsMenu } from "./ContentFormOptionsMenu/index.js";
import { RevisionSelector } from "~/admin/components/ContentEntryForm/Header/RevisionSelector/index.js";
import { Helmet } from "react-helmet";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/index.js";
import { IsModelPublishable } from "~/exports/admin/cms.js";

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
            <IsModelPublishable>
                <RevisionSelector />
            </IsModelPublishable>
            <div className={"flex items-center gap-sm"}>
                <Buttons actions={buttonActions} />
                <ContentFormOptionsMenu />
            </div>
        </div>
    );
});
