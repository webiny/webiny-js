import * as React from "react";
import { Plugin } from "@webiny/plugins/types";
import { ReactElement, ReactNode } from "react";
import {
    FormRenderPropParams,
    FormAPI,
    BindComponent as BaseBindComponent,
    BindComponentRenderProp as BaseBindComponentRenderProp,
    BindComponentProps as BaseBindComponentProps
} from "@webiny/form";
import { ApolloClient } from "apollo-client";
import { IconPrefix, IconName } from "@fortawesome/fontawesome-svg-core";
import Label from "./admin/components/ContentEntryForm/Label";
import { SecurityPermission } from "@webiny/app-security/types";

interface QueryFieldParams {
    field: CmsEditorField;
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
        validators?: string[];
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
        listValidators?: string[];
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
        createField: () => Pick<CmsEditorField, "type" | "validation" | "renderer" | "settings">;
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
            form: FormRenderPropParams;
            afterChangeLabel: (value: string) => void;
            uniqueFieldIdValidator: (fieldId: string) => void;
            contentModel: CmsEditorContentModel;
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
            form: FormRenderPropParams;
            field: CmsEditorField;
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
    };
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
         * A display name for the field in the UI. It is a `ReactNode` type so you can return a component if you want to.
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
        canUse(props: { field: CmsEditorField }): boolean;
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
        render(props: {
            field: CmsEditorField;
            Label: typeof Label;
            getBind: (index?: number, key?: string) => BindComponent;
            contentModel: CmsEditorContentModel;
        }): React.ReactNode;
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

export type CmsEditorField<T = unknown> = T & {
    id: string;
    type: string;
    fieldId: CmsEditorFieldId;
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
        fields?: CmsEditorField<any>[];
        layout?: string[][];
        models?: Pick<CmsModel, "modelId" | "name">[];
        imagesOnly?: boolean;
        [key: string]: any;
    };
    renderer: {
        name: string;
    };
};

export type CmsEditorFieldId = string;
export type CmsEditorFieldsLayout = CmsEditorFieldId[][];

export interface CmsEditorContentModel {
    id: string;
    group: Pick<CmsGroup, "id" | "name">;
    description?: string;
    version: number;
    layout?: CmsEditorFieldsLayout;
    fields: CmsEditorField[];
    lockedFields: CmsEditorField[];
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
    /**
     * If model is a plugin one (it cannot be changed/deleted)
     */
    plugin?: boolean;
}

export type CmsContentEntryStatusType =
    | "draft"
    | "published"
    | "unpublished"
    | "changesRequested"
    | "reviewRequested";

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
    message: string;
    settings: any;
}

export interface CmsEditorFieldValidatorPluginValidator {
    name: string;
    label: string;
    description: string;
    defaultMessage: string;
    defaultSettings?: Record<string, any>;
    renderSettings?: (props: {
        field: CmsEditorField;
        Bind: BindComponent;
        setValue: (name: string, value: any) => void;
        setMessage: (message: string) => void;
        data: CmsEditorFieldValidator;
    }) => React.ReactElement;
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

export interface CmsContentDetailsRevisionContentPlugin extends Plugin {
    type: "cms-content-details-revision-content";
    render(params: any): ReactElement;
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
    message: any;
    settings: any;
}

export interface CmsModelFieldValidatorPlugin<T = any> extends Plugin {
    type: "cms-model-field-validator";
    validator: {
        name: string;
        validate: (value: T, validator: CmsFieldValidator) => Promise<any>;
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

export interface UseContentModelEditorReducerState {
    apolloClient: ApolloClient<any>;
    id: string;
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
    transform: (value: any, field: CmsEditorField) => any;
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
        contentModel: CmsEditorContentModel;
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
export type CmsModel = CmsEditorContentModel;
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
interface BindComponentRenderProp extends BaseBindComponentRenderProp {
    parentName: string;
    appendValue: (value: any) => void;
    prependValue: (value: any) => void;
    appendValues: (values: any[]) => void;
    removeValue: (index: number) => void;
}

interface BindComponentProps extends Omit<BaseBindComponentProps, "children" | "name"> {
    name?: string;
    children?: ((props: BindComponentRenderProp) => React.ReactElement) | React.ReactElement;
}

export type BindComponent = React.FC<BindComponentProps> & {
    parentName?: string;
};
