"use client";
import { useEffect, useState } from "react";
import { autorun } from "mobx";
import { contentSdk, type DocumentElement } from "@webiny/website-builder-sdk";

/**
 * Whether this component's element, or an element inside it, is selected in the editor.
 * Use it to show content that is normally hidden, e.g. a dialog opens itself while it's selected,
 * or an accordion expands while one of its items is selected.
 * Always `false` outside the editor.
 */
export const useIsElementSelected = (element: Pick<DocumentElement, "id">): boolean => {
    const [isSelected, setIsSelected] = useState(false);

    useEffect(() => {
        const editingSdk = contentSdk.getEditingSdk();
        if (!editingSdk) {
            return;
        }

        return autorun(() => {
            setIsSelected(editingSdk.isElementSelected(element.id));
        });
    }, [element.id]);

    return isSelected;
};
