import * as React from "react";
import { ReactElement, ReactNode } from "react";
import { Plugin } from "@webiny/plugins/types";
import {
    BindComponent as BaseBindComponent,
    BindComponentProps as BaseBindComponentProps,
    BindComponentRenderProp as BaseBindComponentRenderProp,
    FormAPI
} from "@webiny/form";
import { IconName, IconPrefix } from "@fortawesome/fontawesome-svg-core";
import { SecurityPermission } from "@webiny/app-security/types";
import {
    CmsModelFieldValidator,
    CmsModelFieldValidatorsFactory,
    CmsModelFieldValidatorsGroup
} from "./validation";
import { CmsModel, CmsModelField } from "./model";
import { CmsIdentity } from "~/types/shared";
import type { SourceType } from "dnd-core";

export type DragObjectWithType = {
    type: SourceType;
};

export * from "./validation";
export * from "./model";
export * from "./shared";

interface QueryFieldParams {
    model: CmsModel;
    field: CmsModelField;
    graphQLTypePrefix: string;
}

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
    type: "row" | "field" | "newField";
    fieldType?: string;
    field?: CmsModelField | null;
    fields?: CmsModelField[];
}

/**
 * @deprecated Use `CmsModelFieldTypePlugin`.
 */
export type CmsEditorFieldTypePlugin = CmsModelFieldTypePlugin;

export interface CmsModelFieldTypePlugin extends Plugin {
    /**
     * a plugin type
     */
    type: "cms-editor-field-type";
    field: {
        /**
         * A unique identifier of the field type (text, number, json, myField, ...).
         *
         * ```ts
         * type: "myField"
         * ```
         */
        type: string;
        /**
         * A display name for the field.
         *
         * ```ts
         * label: "Field name"
         * ```
         */
        label: string;
        /**
         * A list of available validators for the model field.
         *
         * ```ts
         * validators: [
         *     "required",
         *     "gte",
         *     "lte"
         * ]
         * ```
         */
        validators?: string[] | CmsModelFieldValidatorsGroup | CmsModelFieldValidatorsFactory;
        /**
         * A list of available validators when a model field accepts a list (array) of values.
         *
         * ```ts
         * listValidators: [
         *     "minLength",
         *     "maxLength"
         * ]
         * ```
         */
        listValidators?: string[] | CmsModelFieldValidatorsGroup | CmsModelFieldValidatorsFactory;
        /**
         * An explanation of the field displayed beneath the label.
         *
         * ```ts
         * description: "A short description of the field"
         * ```
         */
        description: string;
        /**
         * A ReactNode to display the icon for the field.
         *
         * ```tsx
         * icon: <MyIconComponent />
         * ```
         */
        icon: React.ReactNode;
        /**
         * Is it allowed to have multiple values in this field?
         *
         * ```ts
         * allowMultipleValues: true
         * ```
         */
        allowMultipleValues?: boolean;
        /**
         * Does this field type have a fixed list of values that can be selected?
         *
         * ```ts
         * allowPredefinedValues: false
         * ```
         */
        allowPredefinedValues?: boolean;
        /**
         * A ReactNode label when multiple values are enabled.
         */
        multipleValuesLabel?: React.ReactNode;
        /**
         * These are default values when the field is first created. This is a representation of the field that is stored in the database.
         *
         * ```ts
         * createField: () => ({
         *     type: "fieldType",
         *     validation: [],
         *     renderer: {
         *         name: "fieldTypeRenderer"
         *     }
         * })
         * ```
         */
        createField: () => Pick<CmsModelField, "type" | "validation" | "renderer" | "settings">;
        /**
         * If `true` (default), this field will be configurable via a settings dialog.
         * If `false`, a user will not be able to open the settings dialog, not will the dialog be opened on field drop.
         */
        canEditSettings?: boolean;
        /**
         * Determine if a `draggable` can be dropped into this field.
         * NOTE: This is only applicable to nested field types.
         */
        canAccept?(field: CmsModelField, draggable: DragSource): boolean;
        /**
         * If `true` (default), will allow fields to be laid out into columns (next to each other).
         * If `false`, horizontal layout will not be allowed.
         * NOTE: This is only applicable to nested field types.
         */
        allowLayout?: boolean;
        /**
         * A ReactNode that you can add in the section below the help text when creating/editing field.
         *
         * ```tsx
         * renderSettings: (params) => {
         *     return <FieldSettingsComponent />;
         * }
         * ```
         */
        renderSettings?: (params: {
            afterChangeLabel: (value: string) => void;
            uniqueFieldIdValidator: (fieldId: string) => void;
            contentModel: CmsModel;
        }) => React.ReactNode;
        /**
         * A ReactNode that renders in the Predefined values tab.
         *
         * ```tsx
         * renderPredefinedValues: (params) => {
         *     const {form: {Bind}} = params;
         *     return (
         *         <Bind name="fieldProperty">
         *             <InputComponent />
         *         </Bind>
         *     );
         * }
         * ```
         */
        renderPredefinedValues?: (params: {
            getBind: (index?: number) => any;
        }) => React.ReactElement;
        /**
         * Object wrapper for GraphQL stuff
         */
        graphql?: {
            /**
             * Define field selection.
             *
             * ```ts
             * graphql: {
             *     queryField: `
             *         {
             *             id
             *             title
             *             createdOn
             *         }
             *     `,
             * }
             * ```
             */
            queryField?: string | ((params: QueryFieldParams) => string | null);
        };
        render?(params: any): React.ReactElement;
        tags?: string[];
        /**
         * Render additional information in the Admin UI Model edit view
         */
        renderInfo?: (params: { field: CmsModelField; model: CmsModel }) => React.ReactElement;
    };
}

export interface CmsModelFieldRendererSettingsProps {
    field: CmsModelField;
}

export interface CmsModelFieldRendererProps {
    field: CmsModelField;
    Label: React.ComponentType<React.PropsWithChildren>;
    getBind: <T = any>(index?: number, key?: string) => BindComponent<T>;
    contentModel: CmsModel;
}

/**
 * @deprecated Use `CmsModelFieldRendererProps`.
 */
export type CmsEditorFieldRendererProps = CmsModelFieldRendererProps;

/**
 * @deprecated Use `CmsModelFieldRendererPlugin`.
 */
export type CmsEditorFieldRendererPlugin = CmsModelFieldRendererPlugin;

export interface CmsModelFieldRendererPlugin extends Plugin {
    /**
     * a plugin type
     */
    type: "cms-editor-field-renderer";
    renderer: {
        /**
         * Name of the renderer to match the one from `createField()` method in `CmsModelFieldTypePlugin`.
         *
         * ```ts
         * renderName: "myFieldTypeRenderer"
         * ```
         */
        rendererName: string;
        /**
         * A display name for the field in the UI. It is a `ReactNode` type, so you can use a JSX element.
         *
         * ```tsx
         * name: <MyFieldNameComponent />
         * ```
         */
        name: React.ReactNode;
        /**
         * A description for the field in the UI. Works exactly like the `name` property.
         *
         * ```tsx
         * name: <MyFieldDescriptionComponent />
         * ```
         */
        description: React.ReactNode;
        /**
         * A method that determines if the field can be rendered by this plugin.
         *
         * ```ts
         * canUse({ field }) {
         *     return (
         *         field.type === "myType" && !field.multipleValues
         *     );
         * }
         * ```
         */
        canUse(props: {
            field: CmsModelField;
            fieldPlugin: CmsModelFieldTypePlugin;
            model: CmsModel;
        }): boolean;
        /**
         * Renders a field in the UI.
         *
         * ```tsx
         * render({ field, getBind }) {
         *     const Bind = getBind();
         *
         *     return (
         *         <Bind>
         *             {bind => {
         *                 return (
         *                     <Input
         *                         value={bind.value}
         *                         onChange={bind.onChange}
         *                     />
         *                 )
         *             }}
         *         </Bind>
         *     );
         * }
         * ```
         */
        render(props: CmsModelFieldRendererProps): React.ReactNode;
        renderSettings?: (props: CmsModelFieldRendererSettingsProps) => React.ReactNode;
    };
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
    layout: string[][];
    validation: CmsModelFieldValidator[];
    tags?: string[];
}

export interface CmsDynamicZoneTemplateWithTypename extends CmsDynamicZoneTemplate {
    __typename: string;
}

export type CmsContentEntryStatusType = "draft" | "published" | "unpublished";

/**
 * @deprecated Use `CmsContentEntry`.
 */
export type CmsEditorContentEntry = CmsContentEntry;

export interface CmsContentEntry {
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
    meta: {
        title: string;
        description?: string;
        image?: string;
        locked: boolean;
        status: CmsContentEntryStatusType;
        version: number;
    };
    [key: string]: any;
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
    meta: {
        title: string;
        locked: boolean;
        status: CmsContentEntryStatusType;
        version: number;
    };
}

export type CmsEditorContentTab = React.ComponentType<{ activeTab: boolean }>;

// ------------------------------------------------------------------------------------------------------------
export interface CmsEditorFieldOptionPlugin extends Plugin {
    type: "cms-editor-field-option";
    render(): ReactElement;
}

export interface CmsContentDetailsPlugin extends Plugin {
    render: (params: any) => ReactNode;
}

export interface FieldLayoutPosition {
    row: number;
    index: number | null;
}

export interface CmsEditorFormSettingsPlugin extends Plugin {
    type: "cms-editor-form-settings";
    title: string;
    description: string;
    icon: React.ReactElement;
    render(props: { Bind: BaseBindComponent; form: FormAPI; formData: any }): React.ReactNode;
    renderHeaderActions?(props: {
        Bind: BaseBindComponent;
        form: FormAPI;
        formData: any;
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
    getIcons(): CmsIcon[];
}

/**
 * Transform field value when sending data to the API.
 */
export interface CmsFieldValueTransformer<TField extends CmsModelField = CmsModelField>
    extends Plugin {
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
export interface CmsSecurityPermission extends SecurityPermission {
    accessLevel?: "full" | "no" | "custom";
    models?: Record<string, string>;
    groups?: Record<string, string>;
    endpoints?: string[];
    locales?: string[];
    rwd?: string;
    own?: boolean;
    pw?: string;
}

/**
 * @category GraphQL
 * @category Error
 */
export interface CmsErrorResponse {
    message: string;
    code: string;
    data: Record<string, any>;
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
};

/**
 * After RequestReview and RequestChanges was removed, we need an option to add new status filters
 */
export interface CmsEntryFilterStatusPlugin extends Plugin {
    type: "cms.entry.filter.status";
    label: string;
    value: string;
}
