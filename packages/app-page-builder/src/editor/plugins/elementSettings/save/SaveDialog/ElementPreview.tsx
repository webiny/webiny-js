import React, { useEffect } from "react";
import domToImage from "./domToImage";

const generateImage = async (element: any, onChange: (value: string) => void): Promise<void> => {
    const node = document.getElementById(element.id);
    if (!node) {
        return;
    }

    const dataUrl = await domToImage.toPng(node, {
        width: 2000,
        filter: (element: Element) => {
            return element.tagName !== "PB-ELEMENT-CONTROLS-OVERLAY";
        }
    });

    onChange(dataUrl);
};

type ElementPreviewPropsType = {
    element: any;
    onChange: (value: string) => void;
};
const ElementPreview: React.FC<ElementPreviewPropsType> = ({ element, onChange }) => {
    useEffect(() => {
        generateImage(element, onChange);
    });

    return null;
};

export default ElementPreview;
