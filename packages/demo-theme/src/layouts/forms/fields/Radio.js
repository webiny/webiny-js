// @flow
import * as React from "react";
import { useI18N } from "webiny-app-forms/__i18n/components";
import type { FieldType } from "webiny-app-forms/types";

type Props = {
    bind: Object,
    field: FieldType
};

const Radio = (props: Props) => {
    const { onChange, value } = props.bind;
    const { translate } = useI18N();

    return (
        <div className="webiny-cms-form-field webiny-cms-form-field--radio">
            <label className="webiny-cms-form-field__label webiny-cms-typography-body">
                {translate(props.field.label)}
            </label>
            <div className="webiny-cms-form-field__radio-group">
                {props.field.options.map(option => (
                    <div className="webiny-cms-form-field__radio" key={option.value}>
                        <input
                            checked={value === option.value}
                            onChange={() => onChange(option.value)}
                            name={props.field.fieldId}
                            className="webiny-cms-form-field__radio-input"
                            type="radio"
                            id={"radio-" + props.field.fieldId + option.value}
                            value={option.value}
                        />
                        <label
                            htmlFor={"radio-" + props.field.fieldId + option.value}
                            className="webiny-cms-form-field__radio-label"
                        >
                            {translate(option.label)}
                        </label>
                    </div>
                ))}
            </div>
            <div className="webiny-cms-form-field__helper-text">{translate(props.field.helpText)}</div>
        </div>
    );
};

export default Radio;
