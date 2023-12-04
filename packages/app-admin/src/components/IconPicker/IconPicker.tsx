import React, { useMemo, useEffect } from "react";

import { IconPickerWithConfig, useIconPickerConfig } from "./config";
import { iconRepositoryFactory } from "./IconRepositoryFactory";
import { IconPickerPresenter } from "./IconPickerPresenter";
import { IconPickerComponent, IconPickerProps } from "./IconPickerComponent";
import { IconProvider, IconRenderer } from "./IconRenderer";
import { IconPickerTab } from "./IconPickerTab";
import { Icon } from "./types";

const IconPickerInner = (props: IconPickerProps) => {
    const { iconTypes, iconPackProviders } = useIconPickerConfig();
    const repository = iconRepositoryFactory.getRepository(iconTypes, iconPackProviders);

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

interface IconRendererWithProviderProps {
    icon: Icon;
}

const IconRendererWithProvider = ({ icon }: IconRendererWithProviderProps) => {
    return (
        <IconPickerWithConfig>
            <IconProvider icon={icon}>
                <IconRenderer />
            </IconProvider>
        </IconPickerWithConfig>
    );
};

IconPicker.Icon = IconRendererWithProvider;
IconPicker.IconPickerTab = IconPickerTab;

export { IconPicker };
