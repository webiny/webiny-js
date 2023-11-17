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

import { IconPickerPlugin, Icon } from "./types";
import { IconPickerPresenter } from "./IconPickerPresenter";
import { IconRepository } from "./domain/IconRepository";
import { IconRenderer } from "./IconRenderer";
import {
    IconPickerWrapper,
    iconPickerLabel,
    IconPickerInput,
    MenuContent,
    MenuHeader,
    placeholderIcon
} from "./IconPicker.styles";

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

            const index = iconPickerPlugins.findIndex(
                plugin => plugin.iconType === presenter.vm.selectedIcon?.type
            );

            if (index !== -1) {
                tabsRef.current.switchTab(index);
            }
        }, [tabsRef, iconPickerPlugins, presenter.vm.selectedIcon]);

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
                    onOpen={handleSwitchTab}
                >
                    {({ closeMenu }) => (
                        <>
                            <MenuHeader>
                                <Typography use={"body1"}>Select an icon</Typography>
                                <CloseIcon onClick={() => closeMenu()} />
                            </MenuHeader>
                            <MenuContent>
                                {presenter.vm.isLoading && <CircularProgress />}
                                <Tabs ref={tabsRef}>
                                    {/* Order of tabs defined here: `packages/app-admin/components/IconPicker/plugins/index.ts`. */}
                                    {iconPickerPlugins.map(plugin => {
                                        const iconsByType = presenter.vm.data.find(
                                            iconsByType => iconsByType.type === plugin.iconType
                                        );

                                        if (!iconsByType) {
                                            return;
                                        }

                                        return plugin.renderTab({
                                            label: iconsByType.type,
                                            rows: iconsByType.rows,
                                            value: presenter.vm.selectedIcon,
                                            onChange: (icon: Icon, close = true) => {
                                                presenter.setIcon(icon);

                                                if (close) {
                                                    closeMenu();
                                                }
                                            },
                                            filter: presenter.vm.filter,
                                            onFilterChange: value => presenter.filterIcons(value),
                                            color: presenter.vm.color,
                                            onColorChange: color => presenter.setColor(color),
                                            checkSkinToneSupport: icon =>
                                                presenter.checkSkinToneSupport(icon)
                                        });
                                    })}
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
        );
    }
);
