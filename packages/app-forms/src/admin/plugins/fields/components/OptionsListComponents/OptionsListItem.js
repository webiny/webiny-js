// @flow
// $FlowFixMe
import React from "react";
import { I18NValue } from "@webiny/app-i18n/components";
import { I18NInput } from "@webiny/app-i18n/admin/components";
import { css } from "emotion";
import { IconButton } from "@webiny/ui/Button";

import { Switch } from "@webiny/ui/Switch";
import { ReactComponent as EditIcon } from "@webiny/app-forms/admin/icons/edit.svg";
import { ReactComponent as DeleteIcon } from "@webiny/app-forms/admin/icons/delete.svg";
import { ReactComponent as TranslateIcon } from "@webiny/app-forms/admin/icons/round-translate-24px.svg";

const optionsListItemLeft = css({
    display: "flex",
    justifyContent: "left",
    alignItems: "center"
});

const optionsListItemRight = css({
    display: "flex",
    justifyContent: "right",
    alignItems: "center"
});

const DefaultValueSwitch = ({
    multiple,
    option,
    value: currentDefaultValue,
    onChange: setDefaultValue
}: *) => {
    if (multiple) {
        const selected =
            Array.isArray(currentDefaultValue) && currentDefaultValue.includes(option.value);

        return (
            <Switch
                value={selected}
                onChange={() => {
                    if (selected) {
                        const value = Array.isArray(currentDefaultValue)
                            ? [...currentDefaultValue]
                            : [];

                        value.splice(value.indexOf(option.value), 1);
                        setDefaultValue(value);
                    } else {
                        const value = Array.isArray(currentDefaultValue)
                            ? [...currentDefaultValue]
                            : [];
                        value.push(option.value);
                        setDefaultValue(value);
                    }
                }}
            />
        );
    }

    const selected = currentDefaultValue === option.value;
    return (
        <Switch
            value={selected}
            onChange={() => {
                const newValue = selected ? "" : option.value;
                setDefaultValue(newValue);
            }}
        />
    );
};

export default function OptionsListItem(props: *) {
    const {
        option,
        multiple,
        dragHandle,
        Bind,
        deleteOption,
        editOption,
        setOptionTranslations
    } = props;
    return (
        <>
            <div className={optionsListItemLeft}>
                <span>{dragHandle}</span>
                <span>
                    <div>
                        <I18NValue value={option.label} />
                    </div>
                    <div>{option.value}</div>
                </span>
            </div>
            <div className={optionsListItemRight}>
                <IconButton icon={<EditIcon />} onClick={editOption} />
                <I18NInput value={option.label} onChange={setOptionTranslations}>
                    {({ openDialog }) => {
                        return <IconButton icon={<TranslateIcon />} onClick={openDialog} />;
                    }}
                </I18NInput>

                <IconButton icon={<DeleteIcon />} onClick={deleteOption} />
                <span>|</span>
                <Bind name={"settings.defaultValue"}>
                    {({ onChange, value }) => (
                        <DefaultValueSwitch
                            onChange={onChange}
                            value={value}
                            multiple={multiple}
                            option={option}
                        />
                    )}
                </Bind>
            </div>
        </>
    );
}
