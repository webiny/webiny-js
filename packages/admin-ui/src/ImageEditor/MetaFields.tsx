import React from "react";
import { Input } from "~/Input/index.js";

interface MetaFieldsProps {
    alt: string;
    caption: string;
    showAlt: boolean;
    showCaption: boolean;
    onChangeAlt: (value: string) => void;
    onChangeCaption: (value: string) => void;
}

/** Alt text + optional caption, captured alongside the crop/hotspot. */
export const MetaFields = ({
    alt,
    caption,
    showAlt,
    showCaption,
    onChangeAlt,
    onChangeCaption
}: MetaFieldsProps) => {
    if (!showAlt && !showCaption) {
        return null;
    }

    return (
        <div className={"flex flex-col gap-md"}>
            {showAlt ? (
                <Input
                    label={"Alternative text"}
                    description={"Describe the image for screen readers and search engines."}
                    value={alt}
                    onChange={onChangeAlt}
                />
            ) : null}
            {showCaption ? (
                <Input label={"Caption"} value={caption} onChange={onChangeCaption} />
            ) : null}
        </div>
    );
};
