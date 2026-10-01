import type { ITemplateVM } from "~/features/formModel/index.js";

export type ViewMode = "grid" | "list";

export interface TemplateItemProps {
    template: ITemplateVM;
    onSelect: (template: ITemplateVM) => void;
}
