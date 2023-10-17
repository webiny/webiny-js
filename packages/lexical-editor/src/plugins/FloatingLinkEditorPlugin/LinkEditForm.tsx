import React, { useCallback, useEffect } from "react";

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
    const confirmLinkChanges = () => {
        const confirmedLinkData = {
            url: sanitizeUrl(linkUrl.url),
            target: linkUrl.target,
            alt: linkUrl.alt
        };

        if (lastSelection !== null) {
            editor.dispatchCommand(TOGGLE_LINK_NODE_COMMAND, confirmedLinkData);
            savedLinkData.current = { ...confirmedLinkData };
            setEditMode(false);
        }
    };
    const cancelChanges = useCallback(() => {
        // get last saved data back
        if (savedLinkData?.current) {
            setLinkUrl({ ...savedLinkData.current });
        }
        setEditMode(false);
    }, []);

    useEffect(() => {
        if (isUrlLinkReference(linkUrl.url)) {
            // for internal urls, prevent opening the link in a new tab
            setLinkUrl({ ...linkUrl, target: null });
        }
    }, [linkUrl.url]);

    const onInputKeydown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            event.preventDefault();
            confirmLinkChanges();
        } else if (event.key === "Escape") {
            event.preventDefault();
            cancelChanges();
        }
    };

    return (
        <div>
            <h5 className={"link-editor-popup-title"}>Edit Link</h5>
            <div className={"link-editor-section"}>
                <div className={"section-desc"}>
                    <input
                        type={"checkbox"}
                        checked={linkUrl.target === "_blank"}
                        disabled={isUrlLinkReference(linkUrl.url)}
                        onChange={() =>
                            setLinkUrl({ ...linkUrl, target: linkUrl.target ? null : "_blank" })
                        }
                    />
                    <span>Open page in a new tab</span>
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
                        onKeyDown={event => onInputKeydown(event)}
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
                        onKeyDown={event => onInputKeydown(event)}
                    />
                </div>
                <div className={"link-editor-section full-with edit-form-bottom-menu"}>
                    <button className="webiny-ui-button mdc-button" onClick={() => cancelChanges()}>
                        <div className="mdc-button__ripple"></div>
                        <span className="mdc-button__label">Cancel</span>
                    </button>
                    <button
                        className="webiny-ui-button webiny-ui-button--primary mdc-button mdc-button--raised"
                        onClick={() => confirmLinkChanges()}
                    >
                        <div className="mdc-button__ripple"></div>
                        <span className="mdc-button__label">Confirm</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
