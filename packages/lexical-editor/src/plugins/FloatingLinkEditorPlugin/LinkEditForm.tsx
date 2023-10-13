import React from "react";

import { GridSelection, LexicalEditor, NodeSelection, RangeSelection } from "lexical";
import { sanitizeUrl } from "~/utils/sanitizeUrl";
import { isUrlLinkReference } from "~/utils/isUrlLinkReference";
import { TOGGLE_LINK_NODE_COMMAND } from "~/commands/link";

interface LinkFormProps {
    linkUrl: {
        url: string;
        target: string | null;
        alt?: string;
    };
    setEditMode: (mode: boolean) => void;
    lastSelection: RangeSelection | GridSelection | NodeSelection | null;
    inputRef: React.Ref<HTMLInputElement>;
    setLinkUrl: (url: { url: string; target: string | null; alt?: string }) => void;
    savedLinkData: React.MutableRefObject<
        { url: string; target: string | null; alt?: string } | undefined
    >;
    editor: LexicalEditor;
}

export const LinkEditForm = ({
    editor,
    lastSelection,
    linkUrl,
    inputRef,
    savedLinkData,
    setEditMode,
    setLinkUrl
}: LinkFormProps) => {
    const confirmLinkChanges = (editor: LexicalEditor) => {
        const confirmedLinkData = {
            url: sanitizeUrl(linkUrl.url),
            target: linkUrl.target,
            alt: linkUrl.alt
        };

        editor.dispatchCommand(TOGGLE_LINK_NODE_COMMAND, confirmedLinkData);
        savedLinkData.current = { ...confirmedLinkData };
    };
    return (
        <div>
            <h5 className={"link-editor-popup-title"}>Edit Link</h5>
            <div className={"link-editor-section"}>
                <div className={"header"}>
                    <div className={"header_title"}>Target</div>
                </div>
                <div className={"section-desc"}>
                    <input
                        type={"checkbox"}
                        checked={linkUrl.target === "_blank"}
                        disabled={isUrlLinkReference(linkUrl.url)}
                        onChange={() =>
                            setLinkUrl({ ...linkUrl, target: linkUrl.target ? null : "_blank" })
                        }
                    />
                    <span>Open page in a new window</span>
                </div>
            </div>
            <div className={"link-editor-section"}>
                <div className={"header"}>
                    <div className={"header_title"}>Alt text</div>
                </div>
                <div className={"section-desc"}>
                    <input
                        placeholder={"Enter alt text"}
                        className={"link-input full-with"}
                        type={"text"}
                        value={linkUrl.alt}
                        onChange={e => setLinkUrl({ ...linkUrl, alt: e.target.value })}
                    />
                </div>
            </div>
            <div className={"link-editor-section"}>
                <div className={"header"}>
                    <div className={"header_title"}>URL</div>
                </div>
                <div className={"section-desc"}>
                    <input
                        ref={inputRef}
                        placeholder={"URL: https://example.com"}
                        className="link-input full-with"
                        value={linkUrl.url}
                        onChange={event => {
                            setLinkUrl({
                                url: event.target.value,
                                target: linkUrl.target,
                                alt: linkUrl.alt
                            });
                        }}
                        onKeyDown={event => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                if (lastSelection !== null) {
                                    if (linkUrl.url !== "") {
                                        confirmLinkChanges(editor);
                                    }
                                    setEditMode(false);
                                }
                            } else if (event.key === "Escape") {
                                event.preventDefault();
                                // return old confirmed data back
                                if (savedLinkData?.current) {
                                    setLinkUrl({ ...savedLinkData.current });
                                }
                                setEditMode(false);
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
