// @flow
import * as React from "react";
import type { PluginType } from "webiny-plugins/types";
import type { WithCmsPropsType } from "webiny-app-cms/context";
import type { ReCaptchaComponentType } from "webiny-app-forms/components/Form/components/createReCaptchaComponent";
import type { TermsOfServiceComponentType } from "webiny-app-forms/components/Form/components/createTermsOfServiceComponent";
import type { I18NStringValueType } from "webiny-app-i18n/types";

export type FieldIdType = string;
export type FieldsLayoutType = [[FieldIdType]];

export type FieldLayoutPositionType = {
    row: number,
    index: ?number
};

export type FieldValidatorType = {
    name: string,
    message: I18NStringValueType,
    settings: Object
};

export type FieldType = {
    _id: ?string,
    type: ?string,
    fieldId: ?FieldIdType,
    label: ?I18NStringValueType,
    helpText: ?I18NStringValueType,
    placeholderText: ?I18NStringValueType,
    validation: Array<FieldValidatorType>,
    options: Array<{value: string, label: I18NStringValueType}>,
    settings: Object
};

export type FormRenderFieldType = FieldType & {
    validators: Array<(value: any) => boolean>
};

export type FormDataType = {
    id: FieldIdType,
    layout: FieldsLayoutType,
    fields: [FieldType],
    name: string,
    settings: Object
};

export type FormSubmissionData = Object;

export type FormRenderPropsType = {
    getFieldById: Function,
    getFieldByFieldId: Function,
    getFields: () => Array<Array<FormRenderFieldType>>,
    getDefaultValues: () => Object,
    ReCaptcha: ReCaptchaComponentType,
    TermsOfService: TermsOfServiceComponentType,
    submit: (data: Object) => Promise<FormSubmitResponseType>,
    formData: FormDataType
};

export type FormLayoutComponent = (props: FormRenderPropsType) => React.Node;

export type FormComponentPropsType = {
    preview?: boolean,
    data?: Object,
    revision?: string,
    parent?: string
};

export type FormRenderComponentPropsType = {
    preview?: boolean,
    data?: FormDataType,
    client: Object, // withApollo HOC
    cms: WithCmsPropsType // withCms HOC
};

export type FormSubmitResponseType = {
    data: ?Object,
    preview: boolean,
    error: ?{
        message: string,
        code: string
    }
};

export type FormLoadComponentPropsType = {
    preview?: boolean,
    revision?: string,
    parent?: string
};

export type UseFormEditorReducerStateType = {
    apollo: ?Object,
    id: string,
    defaultLayoutRenderer: string
};

export type FormEditorFieldPluginType = PluginType & {
    field: {
        type: string,
        name: string,
        label: string,
        validators?: Array<string>,
        description: string,
        icon: React.Node,
        createField: () => {
            type: string,
            name: string,
            validation: Array<FieldValidatorType>,
            settings: Object
        },
        renderSettings?: ({
            form: Object,
            Bind: React.Node,
            afterLabelChange: () => void,
            uniqueFieldIdValidator: () => void
        }) => React.Node
    }
};

export type FormSettingsPluginType = PluginType & {};

export type FormTriggerHandlerPluginType = PluginType & {
    trigger: {
        id: string,
        handle: ({ trigger: Object, data: Object, form: FormDataType }) => void
    }
};
