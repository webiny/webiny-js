import React from "react";
import { StyleAccordionItem } from "./StyleAccordionItem.js";

interface StyleAccordionProps {
    children: React.ReactNode;
}

const StyleAccordionRoot = ({ children }: StyleAccordionProps) => (
    <div className={"flex flex-col gap-y-sm"}>{children}</div>
);

export const StyleAccordion = Object.assign(StyleAccordionRoot, {
    Item: StyleAccordionItem
});
