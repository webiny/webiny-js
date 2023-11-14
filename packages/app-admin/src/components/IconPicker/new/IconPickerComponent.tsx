import React, { useEffect, useMemo } from "react";

import { FormComponentProps } from "@webiny/ui/types";

import { IconPickerPresenter } from "./IconPickerPresenter";
import { IconPickerMainUIComponent } from "./IconPickerMainUIComponent";

interface IconPickerComponentProps extends FormComponentProps {
    repository: any;
}

export const IconPickerComponent = ({ repository, ...props }: IconPickerComponentProps) => {
    const presenter = useMemo(() => {
        return new IconPickerPresenter(repository);
    }, [repository]);

    useEffect(() => {
        presenter.load(props.value);
    }, []);

    useEffect(() => {
        if (props.onChange) {
            props.onChange(presenter.vm.selectedIcon);
        }
    }, [presenter.vm.selectedIcon]);

    return (
        <IconPickerMainUIComponent
            icons={presenter.vm.icons}
            open={presenter.vm.isOpen}
            value={presenter.vm.selectedIcon}
            onChange={icon => presenter.setIcon(icon)}
            onFilter={value => presenter.filterIcons(value)}
        />
    );
};
