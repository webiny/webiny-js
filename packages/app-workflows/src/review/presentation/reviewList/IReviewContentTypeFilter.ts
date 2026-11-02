import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { PickerOptionIcon } from "~/components/picker/PickerOptionIcon.js";

export interface ReviewContentTypeOption {
    label: string;
    value: string;
    // The app the content type belongs to: its label is the description of the picker row.
    app: WorkflowAppKind;
    icon: PickerOptionIcon;
}

/*
 * The content types a list can be filtered by (D113). Values are what `where.modelId` carries; an
 * app without content types (Website Builder) passes `null` instead.
 */
export interface IReviewContentTypeFilter {
    options: ReviewContentTypeOption[];
}
