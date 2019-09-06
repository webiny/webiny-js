// @flow
import React, { useState, useEffect, useRef, useCallback } from "react";
import Downshift from "downshift";
import { Elevation } from "@webiny/ui/Elevation";
import { usePageBuilder } from "@webiny/app-page-builder/hooks/usePageBuilder";
import { useHandler } from "@webiny/app/hooks/useHandler";
import { Item, Button, List, dropDownDialog } from "./Styled";

const TypographySelector = props => {
    const [showMenu, setShowMenu] = useState(false);
    const dropdown = useRef();
    const { theme } = usePageBuilder();

    useEffect(() => {
        if (showMenu) {
            // $FlowFixMe
            const domRect = dropdown.current.getBoundingClientRect();
            if (domRect.right > window.innerWidth) {
                // $FlowFixMe
                dropdown.current.style.left = window.innerWidth - domRect.right + "px";
            }
        }
    });

    const setBlock = useHandler(props, ({ editor, onChange }) => type => {
        editor.change(change => onChange(change.setBlocks(type)));
    });

    const onStateChange = useCallback(({ isOpen }) => setShowMenu(isOpen), []);

    const { editor } = props;

    let blockType = editor.value.blocks.first().type;
    const style = theme.typography[blockType] || theme.typography.paragraph;

    return (
        <Downshift selectedItem={blockType} onChange={setBlock} onStateChange={onStateChange}>
            {({ isOpen, getToggleButtonProps, getItemProps, highlightedIndex, selectedItem }) => (
                <div>
                    <Button {...getToggleButtonProps()}>{style.label}</Button>
                    {isOpen && (
                        <Elevation z={2} className={dropDownDialog}>
                            <div ref={dropdown}>
                                <List>
                                    {Object.keys(theme.typography).map((name, index) => {
                                        const style = theme.typography[name];

                                        return (
                                            <Item
                                                {...getItemProps({
                                                    item: name,
                                                    isActive: highlightedIndex === index,
                                                    isSelected: selectedItem === name
                                                })}
                                                key={name}
                                            >
                                                {React.createElement(
                                                    style.component || "span",
                                                    { style: style.style },
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
