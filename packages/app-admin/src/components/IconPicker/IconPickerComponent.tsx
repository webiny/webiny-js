import React, { useCallback, useEffect } from "react";
import { observer } from "mobx-react-lite";
import isEqual from "lodash/isEqual";
import { ReactComponent as CloseIcon } from "@material-design-icons/svg/outlined/close.svg";
import { ReactComponent as SearchIcon } from "@material-design-icons/svg/outlined/search.svg";

import { Menu } from "@webiny/ui/Menu";
import { Tabs } from "@webiny/ui/Tabs";
import { Typography } from "@webiny/ui/Typography";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";
import { FormComponentProps } from "@webiny/ui/types";
import { CircularProgress } from "@webiny/ui/Progress";

import { IconPickerPresenter } from "./IconPickerPresenter";
import { IconProvider, IconRenderer } from "./IconRenderer";
import {
    IconPickerWrapper,
    iconPickerLabel,
    IconPickerInput,
    MenuContent,
    MenuHeader,
    placeholderIcon
} from "./IconPicker.styles";
import { IconPickerTabRenderer } from "./IconPickerTab";
import { IconPickerPresenterProvider } from "./IconPickerPresenterProvider";
import { IconTypeProvider } from "./config/IconType";

export interface IconPickerProps extends FormComponentProps {
    label?: string;
    description?: string;
}

export interface IconPickerComponentProps extends IconPickerProps {
    presenter: IconPickerPresenter;
}

export const IconPickerComponent = observer(
    ({ presenter, label, description, ...props }: IconPickerComponentProps) => {
        const { value, onChange } = props;
        const { isValid: validationIsValid, message: validationMessage } = props.validation || {};
        const { activeTab, isMenuOpened, isLoading, iconTypes, selectedIcon } = presenter.vm;

        useEffect(() => {
            if (onChange && selectedIcon && !isEqual(selectedIcon, value)) {
                onChange(selectedIcon);
            }
        }, [selectedIcon]);

        const setActiveTab = (index: number) => presenter.setActiveTab(index);
        const getActiveTab = (type: string) => presenter.getActiveTab(type);

        const resetActiveTab = useCallback(() => {
            setActiveTab(selectedIcon ? getActiveTab(selectedIcon.type) : 0);
        }, [selectedIcon?.type]);

        const openMenu = () => presenter.openMenu();
        const closeMenu = () => presenter.closeMenu();

        return (
            <IconPickerPresenterProvider presenter={presenter}>
                <IconPickerWrapper>
                    {label && (
                        <div className={iconPickerLabel}>
                            <Typography use={"body1"}>{label}</Typography>
                        </div>
                    )}

                    <Menu
                        open={isMenuOpened}
                        handle={
                            <IconPickerInput onClick={openMenu}>
                                {selectedIcon ? (
                                    <IconProvider icon={selectedIcon}>
                                        <IconRenderer />
                                    </IconProvider>
                                ) : (
                                    <SearchIcon
                                        width={32}
                                        height={32}
                                        className={placeholderIcon}
                                    />
                                )}
                            </IconPickerInput>
                        }
                        onClose={closeMenu}
                        onOpen={resetActiveTab}
                    >
                        {() => (
                            <>
                                <MenuHeader>
                                    <Typography use={"body1"}>Select an icon</Typography>
                                    <CloseIcon onClick={closeMenu} />
                                </MenuHeader>
                                <MenuContent>
                                    {isLoading && <CircularProgress />}
                                    <Tabs
                                        value={activeTab}
                                        onActivate={value => setActiveTab(value)}
                                    >
                                        {iconTypes.map(iconType => (
                                            <IconTypeProvider
                                                key={iconType.name}
                                                type={iconType.name}
                                            >
                                                <IconPickerTabRenderer />
                                            </IconTypeProvider>
                                        ))}
                                    </Tabs>
                                </MenuContent>
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
            </IconPickerPresenterProvider>
        );
    }
);
