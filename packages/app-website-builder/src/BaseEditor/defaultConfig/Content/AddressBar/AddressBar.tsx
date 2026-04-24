import React, { useEffect, useState } from "react";
import { BreakpointSelector } from "./BreakpointSelector.js";
import { PreviewInNewTab } from "./PreviewInNewTab.js";
import { OpenInNewTab } from "./OpenInNewTab.js";
import { RefreshPreview } from "./RefreshPreview.js";
import { useSelectFromDocument } from "~/BaseEditor/hooks/useSelectFromDocument.js";
import { PreviewDomain } from "./PreviewDomain.js";
import { usePreviewDomain } from "../usePreviewDomain.js";

export const AddressBar = () => {
    const path = useSelectFromDocument(document => document.properties.path);

    const { previewDomain } = usePreviewDomain();
    const [addressBarUrl, setAddressBarUrl] = useState<string>("");

    useEffect(() => {
        if (!previewDomain) {
            return;
        }

        setAddressBarUrl(`${previewDomain}${path}`);
    }, [path, previewDomain]);

    return (
        <div
            className="w-full h-[49px] flex flex-row p-sm bg-neutral-base border-solid border-b-sm border-neutral-dimmed gap-sm"
            data-affects-preview={"height"}
        >
            <div className={"relative flex-auto"}>
                <div
                    className={
                        "w-full absolute -top-px py-xs-plus pl-xl border-sm text-md peer cursor-not-allowed rounded-md border-neutral-subtle text-neutral-muted bg-neutral-disabled text-neutral-disabled"
                    }
                >
                    <PreviewDomain />
                    {addressBarUrl}
                </div>
                <div className={"absolute right-0 top-0"}>
                    <RefreshPreview />
                    <PreviewInNewTab />
                    <OpenInNewTab />
                </div>
            </div>
            <div className={"flex-none"}>
                <BreakpointSelector />
            </div>
        </div>
    );
};
