import React from "react";
import { Dialog } from "@webiny/admin-ui";
import type { ITemplateVM } from "~/features/formModel/index.js";

/**
 * Templates are picked by clicking a card or a row. Enter and Space do the same for keyboard users,
 * and go through `click()` so `Dialog.Close` closes the dialog too.
 */
const selectOnEnterOrSpace = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
        return;
    }
    event.preventDefault();
    event.currentTarget.click();
};

const FOCUS_CLASSES =
    "focus-visible:outline-none focus-visible:ring-lg focus-visible:ring-primary-dimmed";

interface SelectableTemplateProps {
    template: ITemplateVM;
    onSelect: (template: ITemplateVM) => void;
    className: string;
    children: React.ReactNode;
}

/**
 * A focusable, clickable wrapper that inserts the template and closes the dialog.
 */
export const SelectableTemplate = ({
    template,
    onSelect,
    className,
    children
}: SelectableTemplateProps) => {
    return (
        <Dialog.Close asChild>
            <div
                role={"button"}
                tabIndex={0}
                aria-label={`Insert ${template.label}`}
                onClick={() => onSelect(template)}
                onKeyDown={selectOnEnterOrSpace}
                className={`group cursor-pointer ${FOCUS_CLASSES} ${className}`}
            >
                {children}
            </div>
        </Dialog.Close>
    );
};
