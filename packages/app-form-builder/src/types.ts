// @flow
import * as React from "react";
import { Plugin } from "@webiny/plugins/types";
import { ReCaptchaComponentType } from "@webiny/app-form-builder/components/Form/components/createReCaptchaComponent";
import { TermsOfServiceComponentType } from "@webiny/app-form-builder/components/Form/components/createTermsOfServiceComponent";
import { I18NStringValue } from "@webiny/app-i18n/types";
import { BindComponent } from "@webiny/form";
import { ApolloClient } from "apollo-client";

type FbFormTriggerData = { [key: string]: any };
type FbFormSubmissionData = { [key: string]: any };

type FbFormFieldValidator = {
    name: string;
    message: any;
    settings: any;
};

export type FbFormFieldValidatorPlugin = Plugin & {
    validator: {
        name: string;
        label: string;
        description: string;
        defaultMessage: string;
        renderSettings?: (props: {
            Bind: BindComponent;
            setValue: string;
            setMessage: string;
            data: string;
        }) => React.ReactElement;
    };
};

/*
export default {
    type: "form-editor-field-validator",
    name: "form-editor-field-validator-gte",
    validator: {
        name: "gte",
        label: "Greater or equal",
        description: "Entered value must be equal or greater than the provided max value.",
        defaultMessage: "Value is too small.",
        renderSettings({ Bind }) {
            return (
                <Grid>
                    <Cell span={12}>
                <Bind
                    name={"settings.value"}
            validators={validation.create("required,numeric")}
            >
            <Input
                type={"number"}
            label={"Value"}
            description={"This is the greatest value that will be allowed"}
            />
            </Bind>
            </Cell>
            </Grid>
        );
        }
    }
};
*/

export type FbFormFieldPatternValidatorPlugin = Plugin & {
    pattern: {
        name: string;
        regex: string;
        flags: string;
    };
};

// ---------------------------

export type FieldIdType = string;
export type FieldsLayoutType = [[FieldIdType]];

export type FieldLayoutPositionType = {
    row: number;
    index: number;
};

export type FieldValidatorType = {
    name: string;
    message: I18NStringValue;
    settings: Object;
};

export type FieldType = {
    _id: string;
    type: string;
    name: string;
    fieldId: FieldIdType;
    label: I18NStringValue;
    helpText: I18NStringValue;
    placeholderText: I18NStringValue;
    validation: Array<FieldValidatorType>;
    options: Array<{ value: string; label: I18NStringValue }>;
    settings: Object;
};

export type FormRenderFieldType = FieldType & {
    validators: Array<(value: any) => boolean>;
};

export type FormDataType = {
    id: FieldIdType;
    layout: FieldsLayoutType;
    fields: FieldType[];
    name: string;
    settings: Object;
};

export type FormSubmissionData = Object;

export type FormRenderPropsType = {
    getFieldById: Function;
    getFieldByFieldId: Function;
    getFields: () => Array<Array<FormRenderFieldType>>;
    getDefaultValues: () => { [key: string]: any };
    ReCaptcha: ReCaptchaComponentType;
    TermsOfService: TermsOfServiceComponentType;
    submit: (data: Object) => Promise<FormSubmitResponseType>;
    formData: FormDataType;
};

export type FormLayoutComponent = (props: FormRenderPropsType) => React.ReactNode;

export type FormComponentPropsType = {
    preview?: boolean;
    data?: Object;
    revision?: string;
    parent?: string;
};

export type FormRenderComponentPropsType = {
    preview?: boolean;
    data?: FormDataType;
};

export type FormSubmitResponseType = {
    data: Object;
    preview: boolean;
    error: {
        message: string;
        code: string;
    };
};

export type FormLoadComponentPropsType = {
    preview?: boolean;
    revisionId?: string;
    parentId?: string;
    slug?: string;
    version: number;
};

export type UseFormEditorReducerStateType = {
    apolloClient: ApolloClient<any>;
    id: string;
    defaultLayoutRenderer: string;
};

export type FormEditorFieldPluginType = Plugin & {
    field: {
        type: string;
        name: string;
        label: string;
        validators?: Array<string>;
        description: string;
        icon: React.ReactNode;
        createField: () => {
            type: string;
            name: string;
            validation: Array<FieldValidatorType>;
            settings: Object;
        };
        renderSettings?: (params: {
            form: Object;
            Bind: BindComponent;
            afterLabelChange: () => void;
            uniqueFieldIdValidator: () => void;
        }) => React.ReactNode;
    };
};

export type FormSettingsPluginType = Plugin & {
    title: string;
    description: string;
    icon: React.ReactNode;
    render: FormSettingsPluginRenderFunctionType;
};

export type FormSettingsPluginRenderFunctionType = (props: {
    Bind: BindComponent;
    formData: Object; // Form settings.
    form: Object;
}) => React.ReactNode;

export type FormTriggerHandlerPluginType = Plugin & {
    trigger: {
        id: string;
        handle: (params: { trigger: Object; data: Object; form: FormDataType }) => void;
    };
};

export type FormDetailsPluginType = Plugin & {
    render: (props: Object) => React.ReactNode;
};
