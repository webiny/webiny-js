import { CmsModelField, CmsModelFieldValidation } from "../modelField";

export interface CmsDynamicZoneTemplate {
    id: string;
    name: string;
    gqlTypeName: string;
    description: string;
    icon: string;
    fields: CmsModelField[];
    layout: string[][];
    validation: CmsModelFieldValidation[];
    tags?: string[];
}

/**
 * A definition for dynamic-zone field to show possible type of the field in settings.
 */
export interface CmsModelDynamicZoneField extends CmsModelField {
    /**
     * Settings object for the field. Contains `templates` property.
     */
    settings: {
        templates: CmsDynamicZoneTemplate[];
    };
}
