// @flow
import * as React from "react";
import { useI18N } from "webiny-app-forms/__i18n/components";
import type { FieldType } from "webiny-app-forms/types";

type Props = {
    type?: string,
    bind: Object,
    field: FieldType
};

const Input = (props: Props) => {
    const { onChange, value } = props.bind;
    const { translate } = useI18N();

    return (
        <div className="webiny-cms-form-field webiny-cms-form-field--input">
            <label className="webiny-cms-form-field__label webiny-cms-typography-body">
                {translate(props.field.label)}
            </label>
            <input
                onChange={e => onChange(e.target.value)}
                value={value}
                placeholder={translate(props.field.placeholderText)}
                type={props.type}
                name={props.field.fieldId}
                id={props.field.fieldId}
                className="webiny-cms-form-field__input"
            />
            <div className="webiny-cms-form-field__helper-text">
                {translate(props.field.helpText)}
            </div>
        </div>
    );
};

export default Input;
