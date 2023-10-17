import React from "react";

interface LinkFormProps {
    linkUrl: {
        url: string;
        target: string | null;
        alt?: string;
    };
    setEditMode: (mode: boolean) => void;
    removeLink: () => void;
}

export const LinkPreviewForm = ({ linkUrl, setEditMode, removeLink }: LinkFormProps) => {
    return (
        <div className={"link-preview-form"}>
            <h5 className={"link-editor-popup-title"}>Preview Link</h5>
            <div className="link-input">
                <a href={linkUrl.url} target="_blank" rel="noopener noreferrer">
                    {linkUrl.url}
                </a>
                <div
                    className="link-edit"
                    role="button"
                    tabIndex={0}
                    onMouseDown={event => event.preventDefault()}
                    onClick={() => {
                        setEditMode(true);
                    }}
                />
                <div
                    className="link-unlink"
                    role="button"
                    tabIndex={0}
                    onMouseDown={event => event.preventDefault()}
                    onClick={() => {
                        removeLink();
                    }}
                />
            </div>
            <div className={"link-editor-section"}>
                <ul>
                    <li>
                        {linkUrl.target === "_blank" ? (
                            <span>Open page in a new tab</span>
                        ) : (
                            <span>Open page in the same tab</span>
                        )}
                    </li>
                    {linkUrl.alt && (
                        <li>
                            <span>
                                Alt text: <span>{linkUrl.alt}</span>
                            </span>
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
};
