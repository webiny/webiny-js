import type * as React from "react";
import type { ReactElement, ReactNode } from "react";
import type { Plugin } from "@webiny/plugins/types.js";
import type {
    BindComponent as BaseBindComponent,
    BindComponentProps as BaseBindComponentProps,
    BindComponentRenderProp as BaseBindComponentRenderProp,
    FormAPI
} from "@webiny/form";
import type { IconName, IconPrefix } from "@fortawesome/fontawesome-svg-core";
import type { CmsEditorFieldsLayout, CmsLayoutField, CmsModel, CmsModelField } from "./model.js";
import type { CmsIdentity } from "~/types/shared.js";
import type { SourceType } from "dnd-core";
import type { IconPickerIconDto } from "@webiny/admin-ui";
import type { GenericRecord } from "@webiny/app/types.js";
import type { Identity } from "@webiny/app-admin/domain/Identity.js";
import type { CmsModelFieldValidator } from "./model.js";

export type DragObjectWithType = {
    type: SourceType;
};

export type * from "./model.js";
export { isLayoutField } from "./model.js";
export type * from "./shared.js";

interface Position {
    row: number;
    index: number;
}

interface Location {
    folderId: string;
}

export interface DragSource extends DragObjectWithType {
    parent?: string;
    pos?: Partial<Position>;
    type: "row" | "field" | "newField" | "newLayoutField" | "layoutField";
    fieldType?: string;
    layoutFieldType?: string;
    field?: CmsModelField | null;
    fields?: CmsModelField[];
    layoutField?: CmsLayoutField;
}

export interface CmsEditorFieldPredefinedValuesEntry {
    label: string;
    value: string;
    selected?: boolean;
}

export interface CmsEditorFieldPredefinedValues {
    enabled: boolean;
    values: CmsEditorFieldPredefinedValuesEntry[];
}

export interface CmsDynamicZoneTemplate {
    id: string;
    name: string;
    gqlTypeName: string;
    description: string;
    icon: string;
    fields: CmsModelField[];
    layout: CmsEditorFieldsLayout;
    validation: CmsModelFieldValidator[];
    tags?: string[];
}

export type CmsContentEntryStatusType = "draft" | "published" | "unpublished";

export interface CmsContentEntryLive {
    version: number;
}

export interface CmsContentEntrySystem {
    // to be extended
}

export interface CmsContentEntry<TValues extends GenericRecord = GenericRecord> {
    id: string;
    entryId: string;
    modelId: string;
    createdOn: string;
    createdBy: CmsIdentity;
    savedOn: string;
    savedBy: CmsIdentity;
    modifiedOn: string | null;
    modifiedBy: CmsIdentity | null;
    deletedOn: string | null;
    deletedBy: CmsIdentity | null;
    firstPublishedOn: string | null;
    firstPublishedBy: CmsIdentity | null;
    lastPublishedOn: string | null;
    lastPublishedBy: CmsIdentity | null;
    revisionCreatedOn: string;
    revisionCreatedBy: CmsIdentity;
    revisionSavedOn: string;
    revisionSavedBy: CmsIdentity;
    revisionModifiedOn: string | null;
    revisionModifiedBy: CmsIdentity | null;
    revisionDeletedOn: string | null;
    revisionDeletedBy: CmsIdentity | null;
    revisionFirstPublishedOn: string | null;
    revisionFirstPublishedBy: CmsIdentity | null;
    revisionLastPublishedOn: string | null;
    revisionLastPublishedBy: CmsIdentity | null;
    wbyAco_location: Location;
    live: CmsContentEntryLive | null;
    system: CmsContentEntrySystem | null;
    meta: {
        title: string;
        description?: string;
        image?: string;
        locked: boolean;
        status: CmsContentEntryStatusType;
        version: number;
    };
    revisionDescription?: string;
    values: TValues;
}

export interface CmsContentEntryRevision {
    id: string;
    modelId: string;
    savedOn: string;
    deletedOn: string | null;
    firstPublishedOn: string | null;
    lastPublishedOn: string | null;
    createdBy: CmsIdentity;
    deletedBy: CmsIdentity | null;
    revisionCreatedOn: string;
    revisionSavedOn: string;
    revisionModifiedOn: string | null;
    revisionDeletedOn: string | null;
    revisionFirstPublishedOn: string | null;
    revisionLastPublishedOn: string | null;
    revisionCreatedBy: CmsIdentity;
    revisionSavedBy: CmsIdentity;
    revisionModifiedBy: CmsIdentity | null;
    revisionDeletedBy: CmsIdentity | null;
    revisionFirstPublishedBy: CmsIdentity | null;
    revisionLastPublishedBy: CmsIdentity | null;
    wbyAco_location: Location;
    revisionDescription?: string;
    meta: {
        title: string;
        locked: boolean;
        status: CmsContentEntryStatusType;
        version: number;
    };
}

// ------------------------------------------------------------------------------------------------------------
export interface CmsEditorFieldOptionPlugin extends Plugin {
    type: "cms-editor-field-option";
    render(): ReactElement;
}

export interface CmsContentDetailsPlugin extends Plugin {
    render: (params: any) => ReactNode;
}

export interface CmsEditorFormSettingsPlugin<T = GenericRecord> extends Plugin {
    type: "cms-editor-form-settings";
    title: string;
    description: string;
    icon: React.ReactElement;
    showSave?: boolean;
    render(props: { Bind: BaseBindComponent; form: FormAPI<T>; formData: T }): React.ReactNode;
    renderHeaderActions?(props: {
        Bind: BaseBindComponent;
        form: FormAPI<T>;
        formData: T;
    }): React.ReactNode;
}

export interface CmsIcon {
    /**
     * [ pack, icon ], ex: ["fab", "cog"]
     */
    id: [IconPrefix, IconName];
    /**
     * Icon name
     */
    name: string;
    /**
     * SVG element
     */
    svg: ReactElement;
}

export interface CmsIconsPlugin extends Plugin {
    type: "cms-icons";
    getIcons(): IconPickerIconDto[];
}

/**
 * Transform field value when sending data to the API.
 */
export interface CmsFieldValueTransformer<
    TField extends CmsModelField = CmsModelField
> extends Plugin {
    /**
     * A plugin type.
     */
    type: "cms-field-value-transformer";
    /**
     * A field type for the value transformer. Or a list of field types.
     */
    fieldType: string | string[];
    /**
     * A transformer function that takes a value and returns a new one.
     */
    transform: (value: any, field: TField) => any;
}

/**
 * Define a custom form layout renderer for a specific content model.
 */
export interface CmsContentFormRendererPlugin extends Plugin {
    /**
     * A plugin type.
     */
    type: "cms-content-form-renderer";
    /**
     * Content model ID that will use this renderer.
     */
    modelId: string;

    /**
     * A function that will render a custom form layout.
     */
    render(props: {
        /**
         * Content model that is being rendered.
         */
        contentModel: CmsModel;
        /**
         * Content entry data handled by the Form element.
         */
        data: Record<string, any>;
        /**
         * A component to bind data to the Form.
         */
        Bind: BindComponent;
        /**
         * Content model fields to render.
         */
        fields: Record<string, React.ReactElement>;
    }): React.ReactNode;
}
/**
 * #########################
 * Data types
 * #########################
 */
export interface CmsSecurityPermission extends Identity.Permission {
    accessLevel?: "full" | "no" | "custom";
    models?: string[];
    groups?: string[];
    endpoints?: string[];
    rwd?: string;
    own?: boolean;
    pw?: string;
    _src?: string;
}

/**
 * @category GraphQL
 * @category Error
 */
export interface CmsErrorResponse {
    message: string;
    code: string;
    data?: Record<string, any> | null;
}
/**
 * @category GraphQL
 * @category Meta
 */
export interface CmsMetaResponse {
    totalCount: number;
    cursor: string | null;
    hasMoreItems: boolean;
}

/***
 * ###### FORM ########
 */
export interface BindComponentRenderProp<T = any> extends BaseBindComponentRenderProp<T> {
    parentName: string;
    appendValue: (value: any, index?: number) => void;
    prependValue: (value: any) => void;
    appendValues: (values: any[]) => void;
    removeValue: (index: number) => void;
    moveValueUp: (index: number) => void;
    moveValueDown: (index: number) => void;
}

interface BindComponentProps<T = any> extends Omit<BaseBindComponentProps, "children" | "name"> {
    name?: string;
    children?: ((props: BindComponentRenderProp<T>) => React.ReactElement) | React.ReactElement;
}

export type BindComponent<T = any> = React.ComponentType<BindComponentProps<T>> & {
    parentName: string;
    ValidationContainer: React.ComponentType<{ children: React.ReactNode }>;
};

/**
 * After RequestReview and RequestChanges was removed, we need an option to add new status filters
 */
export interface CmsEntryFilterStatusPlugin extends Plugin {
    type: "cms.entry.filter.status";
    label: string;
    value: string;
}
