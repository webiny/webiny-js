import React, { useState, useEffect, useRef, useCallback, RefObject } from "react";
import Downshift from "downshift";
import { Elevation } from "@webiny/ui/Elevation";
import { ReactComponent as FormatHeadingIcon } from "@webiny/app-i18n/admin/assets/icons/format_size.svg";
import { useHandler } from "@webiny/app/hooks/useHandler";
import { Item, Button, List, dropDownDialog, iconStyle } from "./Styled";
import theme from './theme';

const TypographySelector = props => {
    const [showMenu, setShowMenu] = useState(false);
    const dropdown: RefObject<any> = useRef();

    useEffect(() => {
        if (showMenu) {
            const domRect = dropdown.current.getBoundingClientRect();
            if (domRect.right > window.innerWidth) {
                dropdown.current.style.left = window.innerWidth - domRect.right + "px";
            }
        }
    });

    const setBlock = useHandler(props, ({ editor, onChange }) => type => {
        editor.change(change => onChange(change.setBlocks(type)));
    });

    const onStateChange = useCallback(({ isOpen }) => setShowMenu(isOpen), []);

    const { editor } = props;

    const blockType = editor.value.blocks.first().type;
    const isActive = Boolean(theme.typography[blockType])
    const buttonStyles = isActive ? { color: "var(--mdc-theme-primary)" } : {}
    const style = theme.typography[blockType] || theme.typography.paragraph;

    return (
        <Downshift selectedItem={blockType} onChange={setBlock} onStateChange={onStateChange}>
            {({ isOpen, getToggleButtonProps, getItemProps, selectedItem }) => (
                <div>
                    <Button {...getToggleButtonProps()} style={buttonStyles}><FormatHeadingIcon className={iconStyle}/>{style.label}</Button>
                    {isOpen && (
                        <Elevation z={2} className={dropDownDialog}>
                            <div ref={dropdown}>
                                <List>
                                    {Object.keys(theme.typography).map(name => {
                                        const style = theme.typography[name];

                                        return (
                                            <Item
                                                {...getItemProps({
                                                    item: name,
                                                    // TODO: check this; TS is complaining: isActive: highlightedIndex === index,
                                                    isSelected: selectedItem === name
                                                })}
                                                key={name}
                                            >
                                                {React.createElement(
                                                    style.component || "span",
                                                    {},
                                                    style.label
                                                )}
                                            </Item>
                                        );
                                    })}
                                </List>
                            </div>
                        </Elevation>
                    )}
                </div>
            )}
        </Downshift>
    );
};

export default TypographySelector;
