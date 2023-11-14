import React, { useEffect, useMemo } from "react";

import { ReactComponent as CloseIcon } from "@material-design-icons/svg/outlined/close.svg";
import { ReactComponent as SearchIcon } from "@material-design-icons/svg/outlined/search.svg";

import { Menu } from "@webiny/ui/Menu";
import { Typography } from "@webiny/ui/Typography";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";
import { FormComponentProps } from "@webiny/ui/types";

import { IconPickerPresenter } from "./IconPickerPresenter";
import { IconRepository } from "./domain/IconRepository";
import { IconRenderer } from "../IconRenderer";
import {
    IconPickerWrapper,
    iconPickerLabel,
    IconPickerInput,
    MenuHeader,
    placeholderIcon
} from "../IconPicker.styles";

export interface IconPickerProps extends FormComponentProps {
    label?: string;
    description?: string;
}

export interface IconPickerComponentProps extends IconPickerProps {
    repository: IconRepository;
}

export const IconPickerComponent = ({
    repository,
    label,
    description,
    ...props
}: IconPickerComponentProps) => {
    const { isValid: validationIsValid, message: validationMessage } = props.validation || {};

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

    console.log("Icons", presenter.vm.icons);

    return (
        <IconPickerWrapper>
            {label && (
                <div className={iconPickerLabel}>
                    <Typography use={"body1"}>{label}</Typography>
                </div>
            )}

            <Menu
                handle={
                    <IconPickerInput>
                        {presenter.vm.selectedIcon ? (
                            <IconRenderer icon={presenter.vm.selectedIcon} />
                        ) : (
                            <SearchIcon width={32} height={32} className={placeholderIcon} />
                        )}
                    </IconPickerInput>
                }
            >
                {({ closeMenu }: { closeMenu: () => void }) => (
                    <>
                        <MenuHeader>
                            <Typography use={"body1"}>Select an icon</Typography>
                            <CloseIcon onClick={() => closeMenu()} />
                        </MenuHeader>
                        TABS
                    </>
                )}
            </Menu>

            {validationIsValid === false && (
                <FormElementMessage error>{validationMessage}</FormElementMessage>
            )}
            {validationIsValid !== false && description && (
                <FormElementMessage>{description}</FormElementMessage>
            )}
        </IconPickerWrapper>
    );
};
