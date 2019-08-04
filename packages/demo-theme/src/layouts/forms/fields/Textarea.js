// @flow
import * as React from "react";
import { I18NValue } from "webiny-app-i18n/components";
import type { FieldType } from "webiny-app-forms/types";
import HelperMessage from "../components/HelperMessage";
import type { BindRenderPropsType } from "webiny-form";

type Props = {
    bind: BindRenderPropsType,
    field: FieldType
};

const Textarea = (props: Props) => {
    const { onChange, value, validation } = props.bind;

    return (
        <div className="webiny-cms-form-field webiny-cms-form-field--textarea">
            <label className="webiny-cms-form-field__label webiny-cms-typography-body">
                <I18NValue value={props.field.label} />
            </label>
            <textarea
                onChange={e => onChange(e.target.value)}
                value={value}
                placeholder={I18NValue({ value: props.field.placeholderText })}
                rows={props.field.settings.rows ? props.field.settings.rows : 4}
                name={props.field.fieldId}
                id={props.field.fieldId}
                className="webiny-cms-form-field__textarea"
            />
            <HelperMessage
                isValid={validation.isValid}
                errorMessage={validation.message}
                helperMessage={<I18NValue value={props.field.helpText} />}
            />
        </div>
    );
};

export default Textarea;
