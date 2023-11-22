import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { observer } from "mobx-react-lite";

import { ReactComponent as CloseIcon } from "@material-design-icons/svg/outlined/close.svg";
import { ReactComponent as SearchIcon } from "@material-design-icons/svg/outlined/search.svg";

import { plugins } from "@webiny/plugins";
import { Menu } from "@webiny/ui/Menu";
import { Tabs, TabsImperativeApi } from "@webiny/ui/Tabs";
import { Typography } from "@webiny/ui/Typography";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";
import { FormComponentProps } from "@webiny/ui/types";
import { CircularProgress } from "@webiny/ui/Progress";

import { IconPickerPlugin } from "./types";
import { IconPickerPresenter } from "./IconPickerPresenter";
import { IconRepository } from "./domain/IconRepository";
import { IconProvider, IconRenderer } from "./IconRenderer";
import {
    IconPickerWrapper,
    iconPickerLabel,
    IconPickerInput,
    MenuContent,
    MenuHeader,
    placeholderIcon
} from "./IconPicker.styles";
import { IconPickerTabRenderer } from "~/components/IconPicker/IconPickerTab";
import { IconPickerPresenterProvider } from "./IconPickerPresenterProvider";
import { IconTypeProvider } from "~/components/IconPicker/config/IconType";

export interface IconPickerProps extends FormComponentProps {
    label?: string;
    description?: string;
}

export interface IconPickerComponentProps extends IconPickerProps {
    repository: IconRepository;
}

export const IconPickerComponent = observer(
    ({ repository, label, description, ...props }: IconPickerComponentProps) => {
        const { isValid: validationIsValid, message: validationMessage } = props.validation || {};

        const tabsRef = useRef<TabsImperativeApi>();

        const presenter = useMemo(() => {
            return new IconPickerPresenter(repository);
        }, [repository]);

        useEffect(() => {
            presenter.load(props.value);
        }, [repository, props.value]);

        useEffect(() => {
            if (props.onChange) {
                props.onChange(presenter.vm.selectedIcon);
            }
        }, [presenter.vm.selectedIcon]);

        const iconPickerPlugins = plugins.byType<IconPickerPlugin>("admin-icon-picker");

        const handleSwitchTab = useCallback(() => {
            if (!tabsRef.current) {
                return;
            }

            presenter.openMenu();

            const index = iconPickerPlugins.findIndex(
                plugin => plugin.iconType === presenter.vm.selectedIcon?.type
            );

            if (index !== -1) {
                tabsRef.current.switchTab(index);
            }
        }, [tabsRef, iconPickerPlugins, presenter.vm.selectedIcon]);

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
                        open={presenter.vm.isMenuOpened}
                        handle={
                            <IconPickerInput onClick={openMenu}>
                                {presenter.vm.selectedIcon ? (
                                    <IconProvider icon={presenter.vm.selectedIcon}>
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
                        onOpen={handleSwitchTab}
                        onClose={closeMenu}
                    >
                        {() => (
                            <>
                                <MenuHeader>
                                    <Typography use={"body1"}>Select an icon</Typography>
                                    <CloseIcon onClick={closeMenu} />
                                </MenuHeader>
                                <MenuContent>
                                    {presenter.vm.isLoading && <CircularProgress />}
                                    <Tabs ref={tabsRef}>
                                        {presenter.vm.iconTypes.map(iconType => (
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
