import * as React from "react";
import { Plugin } from "@webiny/plugins/types";
import { ReactElement, ReactNode } from "react";
import { BindComponent, FormChildrenFunctionParams, Form } from "@webiny/form";
import { ApolloClient } from "apollo-client";
import { IconPrefix, IconName } from "@fortawesome/fontawesome-svg-core";
import { SecurityPermission } from "@webiny/app-security/SecurityIdentity";
import Label from "./admin/views/components/ContentModelForm/ContentFormRender/components/Label";

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
        createField: () => CmsEditorField;
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
            form: FormChildrenFunctionParams;
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
            form: FormChildrenFunctionParams;
            getBind: (index?: number) => any;
        }) => React.ReactNode;
        /**
         * Object wrapper for GraphQL stuff
         */
        graphql?: {
            /**
             * Define how does the GraphQL field type look like.
             *
             * ```ts
             * graphql: {
             *     queryField: `
             *         myField {
             *             id
             *             title
             *             createdOn
             *         }
             *     `,
             * }
             * ```
             */
            queryField?: string;
        };
    };
}

export type CmsEditorFieldRendererPlugin = Plugin & {
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
            getBind: (index?: number) => any;
            contentModel: CmsEditorContentModel;
        }): React.ReactNode;
    };
};

export type CmsEditorField<T = unknown> = T & {
    id?: string;
    type: string;
    fieldId?: CmsEditorFieldId;
    label?: string;
    helpText?: string;
    placeholderText?: string;
    validation?: CmsEditorFieldValidator[];
    multipleValuesValidation?: CmsEditorFieldValidator[];
    multipleValues?: boolean;
    predefinedValues?: {
        enabled: boolean;
        values: [{ label: string; value: string }];
    };
    settings?: { [key: string]: any };
    renderer: {
        name: string;
    };
};

export type CmsEditorFieldId = string;
export type CmsEditorFieldsLayout = CmsEditorFieldId[][];

export type CmsEditorContentModel = {
    id: CmsEditorFieldId;
    group: {
        id: string;
        name: string;
    };
    version: number;
    layout?: CmsEditorFieldsLayout;
    fields: CmsEditorField[];
    lockedFields: CmsEditorField[];
    name: string;
    modelId: string;
    titleFieldId: string;
    settings: any;
    status: string;
    savedOn: string;
    revisions: any[];
    meta: any;
};

export type CmsEditorContentEntry = {
    id: string;
    savedOn: string;
    [key: string]: any;
    meta: {
        title: string;
        locked: boolean;
        status: "draft" | "published" | "unpublished" | "changesRequested" | "reviewRequested";
        version: number;
    };
};

export type CmsEditorFieldValidator = {
    name: string;
    message: string;
    settings: any;
};

export type CmsEditorFieldValidatorPlugin = Plugin & {
    type: "cms-editor-field-validator";
    validator: {
        name: string;
        label: string;
        description: string;
        defaultMessage: string;
        renderSettings?: (props: {
            Bind: BindComponent;
            setValue: (name: string, value: any) => void;
            setMessage: (message: string) => void;
            data: CmsEditorFieldValidator;
        }) => React.ReactElement;
    };
};

export type CmsEditorContentTab = React.FC<{
    activeTab: boolean;
}>;

// ------------------------------------------------------------------------------------------------------------

export type CmsContentModelFormProps = {
    loading?: boolean;
    onForm?: (form: any) => void;
    contentModel: CmsEditorContentModel;
    entry?: { [key: string]: any };
    onSubmit?: (data: { [key: string]: any }) => any;
    onChange?: (data: { [key: string]: any }) => any;
};

export type CmsEditorFieldOptionPlugin = Plugin & {
    type: "cms-editor-field-option";
    render(): ReactElement;
};

export type CmsContentDetailsPlugin = Plugin & {
    render: (params: any) => ReactNode;
};

export type CmsContentDetailsRevisionContentPlugin = Plugin & {
    type: "cms-content-details-revision-content";
    render(params: any): ReactElement;
};

export type CmsFormFieldPatternValidatorPlugin = Plugin & {
    type: "cms-editor-field-validator-pattern";
    pattern: {
        name: string;
        message: string;
        label: string;
    };
};

export type CmsFormFieldValidator = {
    name: string;
    message: any;
    settings: any;
};

export type CmsFormFieldValidatorPlugin = Plugin & {
    type: "form-field-validator";
    validator: {
        name: string;
        validate: (value: any, validator: CmsFormFieldValidator) => Promise<any>;
    };
};

export type FieldLayoutPositionType = {
    row: number;
    index: number;
};

export type CmsEditorFormSettingsPlugin = Plugin & {
    type: "content-model-editor-form-settings";
    title: string;
    description: string;
    icon: React.ReactElement<any>;
    render(props: { Bind: BindComponent; form: Form; formData: any }): React.ReactNode;
    renderHeaderActions?(props: {
        Bind: BindComponent;
        form: Form;
        formData: any;
    }): React.ReactNode;
};

export type CmsIcon = {
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
};

export type CmsIconsPlugin = Plugin & {
    type: "cms-icons";
    getIcons(): CmsIcon[];
};

export type FormRenderCmsEditorField = CmsEditorField & {
    validators: Array<(value: any) => boolean>;
};

export type UseContentModelEditorReducerStateType = {
    apolloClient: ApolloClient<any>;
    id: string;
};

export type FormSettingsPluginType = Plugin & {
    title: string;
    description: string;
    icon: React.ReactNode;
    render: FormSettingsPluginRenderFunctionType;
};

export type FormSettingsPluginRenderFunctionType = (props: {
    Bind: BindComponent;
    formData: any; // Content model settings.
    form: any;
}) => React.ReactElement<any>;

export type PermissionRendererPluginRenderFunctionType = (props: {
    value: SecurityPermission;
    setValue: (newValue: SecurityPermission) => void;
}) => React.ReactElement<any>;

export type PermissionRendererCmsManage = Plugin & {
    type: "permission-renderer-cms-manage";
    key: string;
    label: string;
    render: PermissionRendererPluginRenderFunctionType;
};

export type PermissionGroupRendererCMS = Plugin & {
    type: "permission-group-renderer-cms";
    label: string;
    render: ({
        value,
        createSetValue,
        cmsPermissionRendererPlugins
    }: {
        value: any;
        createSetValue: any;
        cmsPermissionRendererPlugins: PermissionRendererCmsManage[];
    }) => React.ReactElement<any>;
};
