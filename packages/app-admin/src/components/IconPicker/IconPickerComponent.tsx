import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";

import { ReactComponent as CloseIcon } from "@material-design-icons/svg/outlined/close.svg";
import { ReactComponent as SearchIcon } from "@material-design-icons/svg/outlined/search.svg";

import { plugins } from "@webiny/plugins";
import { Menu } from "@webiny/ui/Menu";
import { Tabs } from "@webiny/ui/Tabs";
import { Typography } from "@webiny/ui/Typography";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";
import { FormComponentProps } from "@webiny/ui/types";
import { CircularProgress } from "@webiny/ui/Progress";

import { IconPickerTabPlugin, Icon } from "./types";
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

        const presenter = useMemo(() => {
            return new IconPickerPresenter(repository);
        }, [repository]);

        useEffect(() => {
            if (props.onChange) {
                props.onChange(presenter.vm.selectedIcon);
            }
        }, [presenter.vm.selectedIcon]);

        const tabPlugins = plugins.byType<IconPickerTabPlugin>("icon-picker-tab");

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
                            <MenuContent>
                                {presenter.vm.isLoading && <CircularProgress />}
                                <Tabs>
                                    {presenter.vm.data.map(group => {
                                        const tabPlugin =
                                            tabPlugins.find(tab => tab.iconType == group.type) ||
                                            tabPlugins.find(tab => tab.iconType == "default");

                                        if (!tabPlugin) {
                                            return;
                                        }

                                        return tabPlugin.render({
                                            label: group.type,
                                            rows: group.rows,
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
                                            onColorChange: color => presenter.setColor(color)
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
