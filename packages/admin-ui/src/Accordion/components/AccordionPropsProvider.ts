import { createComponentPropsProvider } from "~/utils.js";
import type { AccordionProps } from "../Accordion.js";

const [AccordionPropsProvider, useAccordionProps] =
    createComponentPropsProvider<AccordionProps>();

export { AccordionPropsProvider, useAccordionProps };

