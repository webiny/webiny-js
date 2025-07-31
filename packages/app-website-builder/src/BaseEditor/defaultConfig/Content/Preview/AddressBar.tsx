import React, { useEffect, useState } from "react";
import { BreakpointSelector } from "./BreakpointSelector";
import { PreviewInNewTab } from "./AddressBar/PreviewInNewTab";
import { OpenInNewTab } from "./AddressBar/OpenInNewTab";
import { RefreshPreview } from "./AddressBar/RefreshPreview";
import { useSelectFromDocument } from "~/BaseEditor/hooks/useSelectFromDocument";
import { PreviewDomain } from "./AddressBar/PreviewDomain";
import { usePreviewDomain } from "./usePreviewDomain";

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
        <div className="wby-w-full wby-h-[49px] wby-flex wby-flex-row wby-p-sm wby-bg-neutral-base wby-border-solid wby-border-b-sm wby-border-neutral-dimmed">
            <div className={"wby-relative wby-flex-auto wby-mr-sm"}>
                <div
                    className={
                        "wby-w-full wby-absolute wby-top-[-1px] wby-py-[6px] wby-pl-xl wby-border-sm wby-text-md wby-peer wby-cursor-not-allowed wby-rounded-md wby-border-neutral-subtle wby-text-neutral-muted wby-bg-neutral-disabled wby-text-neutral-disabled"
                    }
                >
                    <PreviewDomain />
                    {addressBarUrl}
                </div>
                <div className={"wby-absolute wby-right-0 wby-top-0"}>
                    <RefreshPreview />
                    <PreviewInNewTab />
                    <OpenInNewTab />
                </div>
            </div>
            <div className={"wby-flex-none"}>
                <BreakpointSelector />
            </div>
        </div>
    );
};
