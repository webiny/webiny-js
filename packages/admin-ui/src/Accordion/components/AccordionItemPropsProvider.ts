import { createComponentPropsProvider } from "~/utils.js";
import type { AccordionItemProps } from "./AccordionItem.js";

const [AccordionItemPropsProvider, useAccordionItemProps] =
    createComponentPropsProvider<AccordionItemProps>();

export { AccordionItemPropsProvider, useAccordionItemProps };

