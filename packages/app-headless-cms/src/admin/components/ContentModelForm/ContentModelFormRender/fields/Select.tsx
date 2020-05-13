import * as React from "react";
import { CmsContentModelModelField } from "@webiny/app-headless-cms/types";
import { I18NValue } from "@webiny/app-i18n/components";
import HelperMessage from "../components/HelperMessage";
import { BindComponentRenderProp } from "@webiny/form";
import { css } from "emotion"

const selectBox = css({
    padding: '16px !important',
    height: '55px !important'
})

type Props = {
    bind: BindComponentRenderProp;
    field: CmsContentModelModelField;
};

const Select = (props: Props) => {
    const { onChange, value, validation } = props.bind;

    return (
        <div className="webiny-fb-form-field webiny-fb-form-field--select">
            {props.field.label && <label className="webiny-fb-form-field__label webiny-pb-typography-body">
                <I18NValue value={props.field.label} />
            </label>}
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                id={props.field.fieldId}
                name={props.field.fieldId}
                className={`webiny-fb-form-field__select ${selectBox}`}
            >
                <option disabled value={""}>
                    {I18NValue({ value: props.field.placeholderText })}
                </option>
                {props.field.options.map(option => (
                    <option key={option.value} value={option.value}>
                        {I18NValue({ value: option.label })}
                    </option>
                ))}
            </select>
            <HelperMessage
                isValid={validation.isValid}
                errorMessage={validation.message}
                helperMessage={<I18NValue value={props.field.helpText} />}
            />
        </div>
    );
};

export default Select;
