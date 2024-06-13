import React from "react";
import { LinkData } from "./FloatingLinkEditorPlugin";

interface LinkFormProps {
    linkData: LinkData;
    onEdit: () => void;
    removeLink: () => void;
}

export const LinkPreviewForm = ({ linkData, onEdit, removeLink }: LinkFormProps) => {
    return (
        <div className={"link-preview-form"}>
            <h5 className={"link-editor-popup-title"}>Preview Link</h5>
            <div className="link-input">
                <a href={linkData.url} target="_blank" rel="noopener noreferrer">
                    {linkData.url}
                </a>
                <div
                    className="link-edit"
                    role="button"
                    tabIndex={0}
                    onMouseDown={event => event.preventDefault()}
                    onClick={onEdit}
                />
                <div
                    className="link-unlink"
                    role="button"
                    tabIndex={0}
                    onMouseDown={event => event.preventDefault()}
                    onClick={removeLink}
                />
            </div>
            <div className={"link-editor-section"}>
                <ul>
                    <li>
                        {linkData.target === "_blank" ? (
                            <span>Open link in a new tab</span>
                        ) : (
                            <span>Open link in the same tab</span>
                        )}
                    </li>
                    {linkData.alt && (
                        <li>
                            <span>
                                Alt text: <span>{linkData.alt}</span>
                            </span>
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
};
