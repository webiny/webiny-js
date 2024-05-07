import React, { useState } from "react";
import { sanitizeUrl } from "~/utils/sanitizeUrl";
import { isAnchorLink } from "~/utils/isAnchorLink";
import { LinkData } from "./FloatingLinkEditorPlugin";

interface LinkFormProps {
    linkData: LinkData;
    onSave: (linkData: LinkData) => void;
    onCancel: () => void;
}

export const LinkEditForm = ({ linkData, onSave, onCancel }: LinkFormProps) => {
    const [linkState, setLinkState] = useState(linkData);

    const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            event.preventDefault();
            onSubmit();
        } else if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
        }
    };

    const onSubmit = () => {
        onSave({
            ...linkState,
            target: isAnchorLink(linkState.url) ? null : linkState.target,
            url: sanitizeUrl(linkState.url)
        });
    };

    return (
        <div>
            <h5 className={"link-editor-popup-title"}>Edit Link</h5>

            <div className={"link-editor-section"}>
                <div className={"header"}>
                    <div className={"header_title"}>URL</div>
                </div>
                <div className={"section-desc"}>
                    <input
                        autoFocus
                        placeholder={"URL: https://example.com"}
                        className="link-input full-with"
                        value={linkState.url}
                        onKeyDown={onInputKeyDown}
                        onChange={e => {
                            return setLinkState(state => ({
                                ...state,
                                url: e.target.value
                            }));
                        }}
                    />
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
                        value={linkState.alt || ""}
                        onKeyDown={onInputKeyDown}
                        onChange={e => {
                            return setLinkState(state => ({
                                ...state,
                                alt: e.target.value
                            }));
                        }}
                    />
                </div>
            </div>
            <div className={"link-editor-section"}>
                <div className={"section-desc"}>
                    <input
                        id={"link-editor-new-tab"}
                        type={"checkbox"}
                        checked={linkState.target === "_blank"}
                        disabled={isAnchorLink(linkState.url)}
                        onChange={e => {
                            return setLinkState(state => ({
                                ...state,
                                target: e.target.checked ? "_blank" : null
                            }));
                        }}
                    />
                    <label htmlFor={"link-editor-new-tab"}>Open link in a new tab</label>
                </div>
            </div>

            <div className={"link-editor-section full-with edit-form-bottom-menu"}>
                <button className="webiny-ui-button mdc-button" onClick={onCancel}>
                    <div className="mdc-button__ripple"></div>
                    <span className="mdc-button__label">Cancel</span>
                </button>
                <button
                    className="webiny-ui-button webiny-ui-button--primary mdc-button mdc-button--raised"
                    onClick={onSubmit}
                >
                    <div className="mdc-button__ripple"></div>
                    <span className="mdc-button__label">Confirm</span>
                </button>
            </div>
        </div>
    );
};
