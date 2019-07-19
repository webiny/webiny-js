// @flow
import * as React from "react";
import { I18NValue } from "webiny-app-i18n/components";
import type { FieldType } from "webiny-app-forms/types";

type Props = {
    bind: Object,
    field: FieldType
};

const Textarea = (props: Props) => {
    const { onChange, value } = props.bind;

    return (
        <div className="webiny-cms-form-field webiny-cms-form-field--textarea">
            <label className="webiny-cms-form-field__label webiny-cms-typography-body">
                <I18NValue value={props.field.label}/>
            </label>
            <textarea
                onChange={e => onChange(e.target.value)}
                value={value}
                placeholder={I18NValue({value: props.field.placeholderText})}
                rows={props.field.rows ? props.field.rows : 4}
                name={props.field.fieldId}
                id={props.field.fieldId}
                className="webiny-cms-form-field__textarea"
            />
            <div className="webiny-cms-form-field__helper-text">
                <I18NValue value={props.field.helpText}/>
            </div>
        </div>
    );
};

export default Textarea;
