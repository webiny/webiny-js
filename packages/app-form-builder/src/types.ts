import * as React from "react";
import { Plugin } from "@webiny/plugins/types";
import { ReCaptchaComponent } from "./components/Form/components/createReCaptchaComponent";
import { TermsOfServiceComponent } from "./components/Form/components/createTermsOfServiceComponent";
import {
    BindComponent,
    FormRenderPropParams,
    FormRenderPropParamsSubmit,
    FormAPI
} from "@webiny/form/types";
import { ApolloClient } from "apollo-client";
import { SecurityPermission } from "@webiny/app-security/types";

export type DropTargetType = "field" | "row" | "conditionGroup" | "step";

export interface DropTarget {
    // Contains info about the Element that we are dragging.
    type: DropTargetType;
    // Property "id" is optional because when we move row it does not have an id.
    id?: string;
    name: string;
}

export type DropPosition = {
    row: number;
    // Property "index" can be null in case we move row.
    index: number | null;
};

export type ContainerType = "step" | "conditionGroup";

export type Container = {
    type: ContainerType;
    id: string;
};

export interface DropSource {
    // Contains info about the Container from which we are dragging an element or elements.
    // containerId and containerType could be undefined in case we are creating a custom field.
    containerId?: string;
    containerType?: ContainerType;
    position: DropPosition;
}

export interface DropDestination {
    // Contains info about the Container in which we are dropping an element or elements.
    containerId: string;
    containerType: ContainerType;
    position: DropPosition;
}

export interface FbErrorResponse {
    message: string;
    code?: string | null;
    data?: Record<string, any>;
}

export interface FbMetaResponse {
    totalCount: number;
    cursor: string;
    hasMoreItems: boolean;
}

export interface FbBuilderFieldValidator {
    name: string;
    message: string;
    settings: any;
}
export interface FbBuilderFormFieldValidatorPluginValidator {
    name: string;
    label: string;
    description: string;
    defaultMessage: string;
    defaultSettings?: Record<string, any>;
    renderSettings?: (props: {
        Bind: BindComponent;
        setValue: (name: string, value: any) => void;
        setMessage: (message: string) => void;
        data: FbBuilderFieldValidator;
        // We need to return this optional "field" property in the case where we want to render different fields based on it's type or format
        formFieldData?: {
            [key: string]: any;
        };
    }) => React.ReactElement;
}
export type FbBuilderFormFieldValidatorPlugin = Plugin & {
    type: "form-editor-field-validator";
    validator: FbBuilderFormFieldValidatorPluginValidator;
};

export type FbBuilderFormFieldPatternValidatorPlugin = Plugin & {
    type: "form-editor-field-validator-pattern";
    pattern: {
        name: string;
        message: string;
        label: string;
    };
};

export type FbFormFieldPatternValidatorPlugin = Plugin & {
    type: "fb-form-field-validator-pattern";
    pattern: {
        name: string;
        regex: string;
        flags: string;
    };
};

export interface FbFormFieldValidator {
    name: string;
    message: any;
    settings: any;
}

export type FbFormFieldValidatorPlugin = Plugin & {
    type: "fb-form-field-validator";
    validator: {
        name: string;
        validate: (value: string, validator: FbFormFieldValidator) => Promise<any>;
    };
};

export type FieldIdType = string;
export type FbFormModelFieldsLayout = FieldIdType[][];

export interface MoveFieldParams {
    field: FieldIdType | FbFormModelField;
    position: FieldLayoutPositionType;
    targetStepId: string;
    sourceStepId: string;
}

export interface FieldLayoutPositionType {
    row: number;
    index: number | null;
}
export interface StepLayoutPositionType {
    row: {
        title: string;
        id: string;
        layout: string[][];
    };
    formStep: FbFormStep;
    index: number | null;
}

export interface FbFormStep {
    id: string;
    title: string;
    layout: FbFormModelFieldsLayout;
}

export interface MoveStepParams {
    source: Omit<DropSource, "containerType">;
    destination: {
        containerId: string;
    };
}

export type FbBuilderFieldPlugin = Plugin & {
    type: "form-editor-field-type";
    field: {
        group?: string;
        unique?: boolean;
        type: string;
        name: string;
        label: string;
        validators?: string[];
        description: string;
        icon: React.ReactNode;
        createField: (props?: { [key: string]: any }) => FbFormModelField;
        renderSettings?: (params: {
            form: FormRenderPropParams;
            afterChangeLabel: (value: string) => void;
            uniqueFieldIdValidator: (fieldId: string) => void;
        }) => React.ReactNode;
    };
};

export interface FbCreatedBy {
    id: string;
    displayName: string;
    type: string;
}

export interface FbRevisionModel {
    id: string;
    name: string;
    version: number;
    status: string;
    savedOn: string;
    createdBy: FbCreatedBy;
}

export interface FbFormDetailsPluginRenderParams {
    // @ts-refactor
    security: Record<string, any>;
    refreshForms: () => Promise<void>;
    form: FbFormModel;
    revisions: FbRevisionModel[];
    loading: boolean;
}

export type FbFormDetailsPluginType = Plugin & {
    type: "forms-form-details-revision-content";
    render: (props: FbFormDetailsPluginRenderParams) => React.ReactNode;
};

export type FbFormDetailsSubmissionsPlugin = Plugin & {
    type: "forms-form-details-submissions";
    render: (props: { form: FbFormModel }) => React.ReactNode;
};

export interface FbFormModel {
    id: FieldIdType;
    formId: string;
    version: number;
    fields: FbFormModelField[];
    steps: FbFormStep[];
    name: string;
    settings: any;
    status: string;
    savedOn: string;
    revisions: FbRevisionModel[];
    overallStats: {
        submissions: number;
        views: number;
        conversionRate: number;
    };
    createdBy: FbCreatedBy;
    triggers: Record<string, any>;
}

export interface FbFormRenderModel extends Omit<FbFormModel, "fields"> {
    fields: FormRenderFbFormModelField[];
}

export interface FbFormModelField {
    _id: string;
    type: string;
    name: string;
    fieldId: FieldIdType;
    label?: string;
    helpText?: string;
    placeholderText?: string;
    validation?: FbBuilderFieldValidator[];
    options?: Array<{ value: string; label: string }>;
    settings: {
        defaultValue?: string | string[];
        rows?: number;
        [key: string]: any;
    };
}

export interface FbFormSubmissionData {
    id: string;
    locale: string;
    data: Record<string, any>;
    meta: {
        ip: string;
        submittedOn: string;
        url: {
            location: string;
            query: Record<string, string>;
        };
    };
    form: {
        id: string;
        parent: string;
        name: string;
        version: number;
        fields: FbFormModelField[];
        steps: FbFormStep[];
    };
}

export type FbFormTriggerHandlerPlugin = Plugin & {
    type: "form-trigger-handler";
    trigger: {
        id: string;
        handle: (params: { trigger: any; data: any; form: Partial<FbFormModel> }) => void;
    };
};

export type FbEditorFormSettingsPlugin = Plugin & {
    type: "form-editor-form-settings";
    title: string;
    description: string;
    icon: React.ReactElement<any>;
    render(props: { Bind: BindComponent; form: FormAPI; formData: any }): React.ReactNode;
    renderHeaderActions?(props: {
        Bind: BindComponent;
        form: FormAPI;
        formData: any;
    }): React.ReactNode;
};

export type FbEditorFieldGroup = Plugin & {
    type: "form-editor-field-group";
    group: {
        title: string;
    };
};

export type FbFormLayout = {
    name: string;
    title: string;
    component: FormLayoutComponent;
};

export type FbFormLayoutPlugin = Plugin & {
    type: "form-layout";
    layout: {
        name: string;
        title: string;
        component: React.ComponentType<any>;
    };
};

export type FbEditorTrigger = Plugin & {
    type: "form-editor-trigger";
    trigger: {
        id: string;
        title: string;
        description: string;
        icon: React.ReactElement<any>;
        renderSettings(params: {
            Bind: BindComponent;
            submit: FormRenderPropParamsSubmit;
            form: FbFormModel;
        }): React.ReactElement<any>;
    };
};

export type FormRenderFbFormModelField = FbFormModelField & {
    validators: ((value: string) => Promise<boolean>)[];
};

export type FormRenderPropsType<T = Record<string, any>> = {
    getFieldById: (id: string) => FbFormModelField | null;
    getFieldByFieldId: (id: string) => FbFormModelField | null;
    getFields: (stepIndex?: number) => FormRenderFbFormModelField[][];
    getDefaultValues: () => { [key: string]: any };
    goToNextStep: () => void;
    goToPreviousStep: () => void;
    isLastStep: boolean;
    isFirstStep: boolean;
    isMultiStepForm: boolean;
    currentStepIndex: number;
    currentStep: FbFormStep;
    ReCaptcha: ReCaptchaComponent;
    reCaptchaEnabled: boolean;
    TermsOfService: TermsOfServiceComponent;
    termsOfServiceEnabled: boolean;
    submit: (data: T) => Promise<FormSubmitResponseType>;
    formData: FbFormModel;
};

export type FormLayoutComponent = React.ComponentType<FormRenderPropsType>;

export interface FormComponentPropsType {
    preview?: boolean;
    data?: FbFormModel;
    revisionId?: string;
    parentId?: string;
    slug?: string;
}

export interface FbFormRenderComponentProps {
    preview?: boolean;
    data?: FbFormModel | null;
    client?: ApolloClient<any>;
}

export interface FormSubmitResponseType {
    data: any;
    preview: boolean;
    error: FbErrorResponse | null;
}

export type FormLoadComponentPropsType = {
    preview?: boolean;
    revisionId?: string;
    parentId?: string;
    slug?: string;
    version?: number;
};

export interface UseFormEditorReducerStateType {
    apolloClient: ApolloClient<any>;
    id: string;
    defaultLayoutRenderer: string;
}

export type FormSettingsPluginType = Plugin & {
    title: string;
    description: string;
    icon: React.ReactNode;
    render: FormSettingsPluginRenderFunctionType;
};

export type FormSettingsPluginRenderFunctionType = (props: {
    Bind: BindComponent;
    formData: any; // Form settings.
    form: any;
}) => React.ReactElement<any>;

/**
 * Data types
 */
export interface FbSettings {
    domain: string;
    reCaptcha: {
        enabled: boolean;
        siteKey: string;
        secretKey: string;
    };
}

/**
 * GraphQL Variables Input
 */
export interface FbFieldOptionsInput {
    label: string;
    value: string;
}

export interface FbFieldValidationInput {
    name: string;
    message: string;
    settings: Record<string, string>;
}

export interface FbFormFieldInput {
    _id: string;
    fieldId: string;
    type: string;
    name: string;
    label: string;
    placeholderText: string;
    helpText: string;
    options: FbFieldOptionsInput[];
    validation: FbFieldValidationInput[];
    settings: Record<string, string>;
}

export interface FbFormSettingsLayoutInput {
    renderer: string;
}

export interface FbTermsOfServiceMessageInput {
    enabled: boolean;
    message: Record<string, string>;
    errorMessage: string;
}

export interface FbFormReCaptchaSettingsInput {
    enabled: boolean;
    siteKey: string;
    secretKey: string;
}

export interface FbReCaptchaInput {
    enabled: boolean;
    errorMessage: Record<string, string>;
    settings: FbFormReCaptchaSettingsInput;
}

export interface FbFormSettingsInput {
    steps: FbFormStep[];
    submitButtonLabel: string;
    fullWidthSubmitButton: boolean;
    successMessage: Record<string, string>;
    termsOfServiceMessage: FbTermsOfServiceMessageInput;
    reCaptcha: FbReCaptchaInput;
}

export interface FbUpdateFormInput {
    name?: string;
    fields?: FbFormFieldInput[];
    steps?: FbFormStep[];
    settings?: FbFormSettingsInput;
    triggers?: Record<string, string>;
}

export interface FormBuilderSecurityPermission extends SecurityPermission {
    own?: boolean;
    rwd?: string;
    pw?: string | boolean;
    submissions?: boolean;
}

export enum ImportExportTaskStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed"
}
export interface FormBuilderImportExportSubTask {
    id: string;
    createdOn: Date;
    createdBy: {
        id: string;
        displayName: string;
        type: string;
    };
    status: "pending" | "processing" | "completed" | "failed";
    data: {
        form: FbFormModel;
        [key: string]: any;
    };
    stats: {
        pending: number;
        processing: number;
        completed: number;
        failed: number;
        total: number;
    };
    error: Record<string, string>;
}

export enum FORM_STATUS {
    DRAFT = "draft",
    PUBLISHED = "published",
    UNPUBLISHED = "unpublished"
}
