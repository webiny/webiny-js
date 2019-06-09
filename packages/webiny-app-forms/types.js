// @flow
import type { PluginType } from "webiny-plugins/types";

export type FieldIdType = string;

export type FieldType = {
    id: FieldIdType,
    fieldId: string,
    label: string,
    type: string,
    validation: []
};

export type RenderFieldPluginType =
    | PluginType
    | {
          field: {
              type: string,
              render: Function
          }
      };

export type FormLayoutPluginType =
    | PluginType
    | {
          render: Function,
          label: string
      };

export type FieldsLayoutType = [[FieldIdType]];

export type UseFormEditorReducerStateType = {
    apollo: ?Object,
    id: string,
    defaultLayoutRenderer: string
};
