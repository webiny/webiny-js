import React, { useMemo, useEffect } from "react";
import { useApolloClient } from "@apollo/react-hooks";

import { IconPickerWithConfig, useIconPickerConfig } from "./config";
import { iconRepositoryFactory } from "./IconRepositoryFactory";
import { IconPickerPresenter } from "./IconPickerPresenter";
import { IconPickerComponent, IconPickerProps } from "./IconPickerComponent";
import { IconRenderer } from "./IconRenderer";

const IconPickerInner = (props: IconPickerProps) => {
    const client = useApolloClient();
    const { iconTypes, iconPackProviders } = useIconPickerConfig();
    const repository = iconRepositoryFactory.getRepository(client, iconTypes, iconPackProviders);

    const presenter = useMemo(() => {
        return new IconPickerPresenter(repository);
    }, [repository]);

    useEffect(() => {
        presenter.load(props.value);
    }, [repository, props.value]);

    return <IconPickerComponent presenter={presenter} {...props} />;
};

const IconPicker = ({
    label,
    description,
    value,
    onChange,
    validate,
    validation
}: IconPickerProps) => {
    return (
        <IconPickerWithConfig>
            <IconPickerInner
                label={label}
                description={description}
                value={value}
                onChange={onChange}
                validate={validate}
                validation={validation}
            />
        </IconPickerWithConfig>
    );
};

IconPicker.Icon = IconRenderer;

export { IconPicker };
