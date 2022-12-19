import * as React from "react";
import { Plugin } from "@webiny/plugins/types";
import { ReactElement, ReactNode } from "react";
import {
    FormAPI,
    BindComponent as BaseBindComponent,
    BindComponentRenderProp as BaseBindComponentRenderProp,
    BindComponentProps as BaseBindComponentProps
} from "@webiny/form";
import { IconPrefix, IconName } from "@fortawesome/fontawesome-svg-core";
import Label from "./admin/components/ContentEntryForm/Label";
import { SecurityPermission } from "@webiny/app-security/types";
import { DragSource } from "~/admin/components/FieldEditor/FieldEditorContext";

interface QueryFieldParams {
    field: CmsModelField;
}

export interface CmsEditorFieldValidatorsDefinition {
    validators: string[];
    title?: string;
    description?: string;
}

export interface CmsEditorFieldValidatorsFactory {
    (field: CmsModelField): string[] | CmsEditorFieldValidatorsDefinition;
}

export interface CmsEditorFieldTypePlugin extends Plugin {
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
        validators?:
            | string[]
            | CmsEditorFieldValidatorsDefinition
            | CmsEditorFieldValidatorsFactory;
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
        listValidators?: string[] | CmsEditorFieldValidatorsDefinition;
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
        allowMultipleValues: boolean;
        /**
         * Does this field type have a fixed list of values that can be selected?
         *
         * ```ts
         * allowPredefinedValues: false
         * ```
         */
        allowPredefinedValues: boolean;
        /**
         * A ReactNode label when multiple values are enabled.
         */
        multipleValuesLabel: React.ReactNode;
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
            queryField?: string | ((params: QueryFieldParams) => string);
        };
        render?(params: any): React.ReactElement;
        tags?: string[];
    };
}

export interface CmsEditorFieldRendererProps {
    field: CmsModelField;
    Label: typeof Label;
    getBind: (index?: number, key?: string) => BindComponent;
    contentModel: CmsModel;
}

export interface CmsEditorFieldRendererPlugin extends Plugin {
    /**
     * a plugin type
     */
    type: "cms-editor-field-renderer";
    renderer: {
        /**
         * Name of the renderer to match the one from `createField()` method in `CmsEditorFieldTypePlugin`.
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
        canUse(props: { field: CmsModelField; fieldPlugin: CmsEditorFieldTypePlugin }): boolean;
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
        render(props: CmsEditorFieldRendererProps): React.ReactNode;
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
    description: string;
    icon: string;
    fields: CmsModelField[];
    layout: string[][];
    validation: CmsEditorFieldValidator[];
}

/**
 * @deprecated Use `CmsModelField` instead.
 */
export type CmsEditorField<T = unknown> = CmsModelField<T>;

export type CmsModelField<T = unknown> = T & {
    id: string;
    type: string;
    fieldId: CmsEditorFieldId;
    storageId?: string;
    label?: string;
    helpText?: string;
    placeholderText?: string;
    validation?: CmsEditorFieldValidator[];
    listValidation?: CmsEditorFieldValidator[];
    multipleValues?: boolean;
    predefinedValues?: CmsEditorFieldPredefinedValues;
    settings?: {
        defaultValue?: string | null | undefined;
        defaultSetValue?: string;
        type?: string;
        fields?: CmsModelField<any>[];
        layout?: string[][];
        models?: Pick<CmsModel, "modelId" | "name">[];
        templates?: CmsDynamicZoneTemplate[];
        imagesOnly?: boolean;
        [key: string]: any;
    };
    renderer: {
        name: string;
    };
    tags?: string[];
};

export type CmsEditorFieldId = string;
export type CmsEditorFieldsLayout = CmsEditorFieldId[][];

export interface CmsModel {
    id: string;
    group: Pick<CmsGroup, "id" | "name">;
    description?: string;
    version: number;
    layout?: CmsEditorFieldsLayout;
    fields: CmsModelField[];
    lockedFields: CmsModelField[];
    name: string;
    modelId: string;
    titleFieldId: string;
    settings: {
        [key: string]: any;
    };
    status: string;
    savedOn: string;
    meta: any;
    createdBy: CmsCreatedBy;
    tags: string[];
    /**
     * If model is a plugin one (it cannot be changed/deleted)
     */
    plugin?: boolean;
}

export type CmsContentEntryStatusType = "draft" | "published" | "unpublished";

export interface CmsEditorContentEntry {
    id: string;
    savedOn: string;
    modelId: string;
    createdBy: CmsCreatedBy;
    meta: {
        title: string;
        publishedOn: string;
        locked: boolean;
        status: CmsContentEntryStatusType;
        version: number;
    };
    [key: string]: any;
}

export interface CmsContentEntryRevision {
    id: string;
    savedOn: string;
    modelId: string;
    createdBy: CmsCreatedBy;
    meta: {
        title: string;
        publishedOn: string;
        locked: boolean;
        status: CmsContentEntryStatusType;
        version: number;
    };
}

export interface CmsEditorFieldValidator {
    name: string;
    message?: string;
    settings?: any;
}

export interface CmsEditorFieldValidatorPluginValidator {
    name: string;
    label: string;
    description: string;
    defaultMessage: string;
    defaultSettings?: Record<string, any>;
    renderSettings?: () => React.ReactElement;
    renderCustomUi?: () => React.ReactElement;
}
export interface CmsEditorFieldValidatorPlugin extends Plugin {
    type: "cms-editor-field-validator";
    validator: CmsEditorFieldValidatorPluginValidator;
}

export type CmsEditorContentTab = React.FC<{ activeTab: boolean }>;

// ------------------------------------------------------------------------------------------------------------
export interface CmsEditorFieldOptionPlugin extends Plugin {
    type: "cms-editor-field-option";
    render(): ReactElement;
}

export interface CmsContentDetailsPlugin extends Plugin {
    render: (params: any) => ReactNode;
}

export interface CmsEditorFieldValidatorPatternPlugin extends Plugin {
    type: "cms-editor-field-validator-pattern";
    pattern: {
        name: string;
        message: string;
        label: string;
    };
}

export interface CmsFieldValidator {
    name: string;
    message?: string;
    settings?: any;
}

export interface CmsModelFieldValidatorPlugin<T = any> extends Plugin {
    type: "cms-model-field-validator";
    validator: {
        name: string;
        validate: (value: T, validator: CmsFieldValidator, field: CmsModelField) => Promise<any>;
    };
}

/**
 * @category Plugin
 * @category ContentModelField
 * @category FieldValidation
 */
export interface CmsModelFieldValidatorPatternPlugin extends Plugin {
    /**
     * A plugin type
     */
    type: "cms-model-field-validator-pattern";
    /**
     * A pattern object for the validator.
     */
    pattern: {
        /**
         * name of the pattern.
         */
        name: string;
        /**
         * RegExp of the validator.
         */
        regex: string;
        /**
         * RegExp flags
         */
        flags: string;
    };
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
export interface CmsFieldValueTransformer extends Plugin {
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
    transform: (value: any, field: CmsModelField) => any;
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
export interface CmsCreatedBy {
    id: string;
    displayName: string;
    type: string;
}
/**
 * @category GraphQL
 * @category Model
 */
export type CmsEditorContentModel = CmsModel;
/**
 * @category GraphQL
 * @category Group
 */
export interface CmsGroup {
    id: string;
    name: string;
    slug: string;
    icon?: string;
    description?: string;
    contentModels: CmsModel[];
    createdBy: CmsCreatedBy;
    /**
     * Tells if this group is a plugin one (cannot be changed/deleted)
     */
    plugin?: boolean;
}
/**
 * @category GraphQL
 * @category Error
 */
export interface CmsErrorResponse {
    message: string;
    code: string;
    data: Record<string, any> | Record<string, any>[];
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
export interface BindComponentRenderProp extends BaseBindComponentRenderProp {
    parentName: string;
    appendValue: (value: any, index?: number) => void;
    prependValue: (value: any) => void;
    appendValues: (values: any[]) => void;
    removeValue: (index: number) => void;
    moveValueUp: (index: number) => void;
    moveValueDown: (index: number) => void;
}

interface BindComponentProps extends Omit<BaseBindComponentProps, "children" | "name"> {
    name?: string;
    children?: ((props: BindComponentRenderProp) => React.ReactElement) | React.ReactElement;
}

export type BindComponent = React.FC<BindComponentProps> & {
    parentName?: string;
};

/**
 * After RequestReview and RequestChanges was removed, we need an option to add new status filters
 */
export interface CmsEntryFilterStatusPlugin extends Plugin {
    type: "cms.entry.filter.status";
    label: string;
    value: string;
}
