import React, { useState, useEffect, useRef, useCallback, RefObject } from "react";
import Downshift from "downshift";
import { Elevation } from "@webiny/ui/Elevation";
import { ReactComponent as FormatHeadingIcon } from "@webiny/app-i18n/admin/assets/icons/format_size.svg";
import { useHandler } from "@webiny/app/hooks/useHandler";
import { Item, Button, List, dropDownDialog, iconStyle } from "./Styled";
import theme from "./theme";
import { Editor, Transforms } from "slate";

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

    const setBlock = useHandler(props, ({ editor }) => type => {
        Transforms.setNodes(editor, { type });
    });

    const onStateChange = useCallback(({ isOpen }) => setShowMenu(isOpen), []);

    const { editor } = props;

    const [match] = Editor.nodes(editor, {
        match: n => Editor.isBlock(editor, n)
    });

    const blockType: string = match ? (match[0].type as string) : "paragraph";

    const style = theme.typography[blockType] || theme.typography.paragraph;

    return (
        <Downshift selectedItem={blockType} onChange={setBlock} onStateChange={onStateChange}>
            {({ isOpen, getToggleButtonProps, getItemProps, selectedItem }) => (
                <div>
                    <Button {...getToggleButtonProps()}>
                        <FormatHeadingIcon className={iconStyle} />
                        {style.label}
                    </Button>
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
