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
    editor: LexicalEditor;
}

export const LinkEditForm = ({
    editor,
    lastSelection,
    linkUrl,
    inputRef,
    setEditMode,
    setLinkUrl
}: LinkFormProps) => {
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
                    <span>Open page in new tab</span>
                </div>
            </div>
            <div className={"link-editor-section"}>
                <div className={"header"}>
                    <div className={"header_title"}>Alt text</div>
                </div>
                <div className={"section-desc"}>
                    <input
                        className={"link-input full-with"}
                        type={"text"}
                        value={linkUrl.alt}
                        onChange={e => setLinkUrl({ ...linkUrl, alt: e.target.value })}
                    />
                </div>
            </div>
            <input
                ref={inputRef}
                className="link-input"
                value={linkUrl.url}
                onChange={event => {
                    setLinkUrl({ url: event.target.value, target: null, alt: linkUrl.alt });
                }}
                onKeyDown={event => {
                    if (event.key === "Enter") {
                        event.preventDefault();
                        if (lastSelection !== null) {
                            if (linkUrl.url !== "") {
                                editor.dispatchCommand(TOGGLE_LINK_NODE_COMMAND, {
                                    url: sanitizeUrl(linkUrl.url),
                                    target: linkUrl.target,
                                    alt: linkUrl.alt
                                });
                            }
                            setEditMode(false);
                        }
                    } else if (event.key === "Escape") {
                        event.preventDefault();
                        setEditMode(false);
                    }
                }}
            />
        </div>
    );
};
