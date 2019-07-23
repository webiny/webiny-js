// @flow
import * as React from "react";
import type { PluginType } from "webiny-plugins/types";
import type { WithCmsPropsType } from "webiny-app-cms/context";

export type FieldIdType = string;
export type FieldsLayoutType = [[FieldIdType]];

export type FieldLayoutPositionType = {
    row: number,
    index: ?number
};

export type FieldType = {
    id: FieldIdType,
    fieldId: string,
    label: string,
    helpText: string,
    placeholderText: string,
    type: string,
    validation: Array<any>,
    settings: Object
} & Object;

export type FormType = {
    id: FieldIdType,
    layout: FieldsLayoutType,
    fields: [FieldType],
    name: string
};

export type FormRenderPropsType = {
    getFieldById: Function,
    getFieldByFieldId: Function,
    getFields: () => [[FieldType]],
    getDefaultValues: () => Object,
    submit: (data: Object) => void,
    form: FormType
};

export type FormComponentPropsType = {
    preview?: boolean,
    data?: Object,
    revision?: string,
    parent?: string
};

export type FormRenderComponentPropsType = {
    preview?: boolean,
    data?: Object,
    client: Object, // withApollo HOC
    cms: WithCmsPropsType // withCms HOC
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

// Plugin types.
export type FormEditorFieldPluginType = PluginType & {
    fieldType: {
        dataType: boolean,
        id: string,
        label: string,
        description: string,
        icon: React.Node,
        validators?: Array<string>,
        createField: Function,
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
        handle: ({ trigger: Object, data: Object, form: FormType }) => void
    }
};
