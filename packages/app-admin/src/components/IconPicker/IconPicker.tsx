import React, { useMemo, useEffect } from "react";
import { useIconPickerConfig } from "./config";
import { iconRepositoryFactory } from "./IconRepositoryFactory";
import { IconPickerPresenter } from "./IconPickerPresenter";
import { IconPickerComponent, IconPickerProps } from "./IconPickerComponent";
import { IconProvider, IconRenderer } from "./IconRenderer";
import { IconPickerTab } from "./IconPickerTab";
import { Icon } from "./types";

const IconPicker = (props: IconPickerProps) => {
    const { iconTypes, iconPackProviders } = useIconPickerConfig();
    const repository = iconRepositoryFactory.getRepository(iconTypes, iconPackProviders);

    const presenter = useMemo(() => {
        return new IconPickerPresenter(repository, props.size);
    }, [repository, props.size]);

    useEffect(() => {
        presenter.load(props.value);
    }, [repository, props.value]);

    return <IconPickerComponent presenter={presenter} {...props} />;
};

interface IconRendererWithProviderProps {
    icon?: Icon;
    size?: number;
}

const IconRendererWithProvider = ({ icon, ...props }: IconRendererWithProviderProps) => {
    if (!icon) {
        return null;
    }

    return (
        <IconProvider icon={icon} {...props}>
            <IconRenderer />
        </IconProvider>
    );
};

IconPicker.Icon = IconRendererWithProvider;
IconPicker.IconPickerTab = IconPickerTab;

export { IconPicker };
