import type { CmsModelField } from "../modelField.js";
import type { CmsModelLayout } from "~/types/index.js";

/**
 * A definition for object field to show possible type of the field in settings.
 */
export interface CmsModelObjectField extends CmsModelField {
    /**
     * Settings object for the field. Contains `templates` property.
     */
    settings: {
        fields: CmsModelField[];
        layout?: CmsModelLayout;
        parents?: string[];
    };
}
