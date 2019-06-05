// @flow

/********************************************
 *           All Form Editor types          *
 ********************************************/

export type FieldIdType = string;

export type FieldType = {
    id: FieldIdType,
    fieldId: string,
    label: string,
    type: string,
    validation: []
};

export type FieldsLayoutType = [[FieldIdType]];

export type UseFormEditorReducerStateType = {
    apollo: Object,
    data: {
        fields: [FieldType],
        layout: FieldsLayoutType
    }
};
