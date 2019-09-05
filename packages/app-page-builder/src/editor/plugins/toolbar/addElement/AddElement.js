//@flow
import React, { useCallback, useState } from "react";
import { connect } from "@webiny/app-page-builder/editor/redux";
import Draggable from "@webiny/app-page-builder/editor/components/Draggable";
import {
    dragStart,
    dragEnd,
    deactivatePlugin,
    dropElement
} from "@webiny/app-page-builder/editor/actions";
import { getPlugins } from "@webiny/plugins";
import { getActivePluginParams } from "@webiny/app-page-builder/editor/selectors";
import { usePageBuilder } from "@webiny/app-page-builder/hooks/usePageBuilder";
import * as Styled from "./StyledComponents";
import { css } from "emotion";
import { List, ListItem, ListItemMeta } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { Typography } from "@webiny/ui/Typography";
import { ButtonFloating } from "@webiny/ui/Button";
import { ReactComponent as AddIcon } from "@webiny/app-page-builder/editor/assets/icons/add.svg";
import type { PbElementPluginType } from "@webiny/app-page-builder/types";

const ADD_ELEMENT = "pb-editor-toolbar-add-element";

const categoriesList = css({
    backgroundColor: "var(--mdc-theme-surface)",
    boxShadow: "inset 1px 0px 5px 0px var(--mdc-theme-background)",
    borderTop: "1px solid var(--mdc-theme-background)",
    ".mdc-list-item": {
        width: 150,
        fontWeight: "600 !important",
        borderBottom: "1px solid var(--mdc-theme-background)",
        "&.active": {
            backgroundColor: "var(--mdc-theme-background)",
            color: "var(--mdc-theme-primary)",
            ".mdc-list-item__meta": {
                color: "var(--mdc-theme-primary)"
            }
        }
    }
});

const AddElement = ({ params, dropElement, dragStart, deactivatePlugin, dragEnd }) => {
    const getGroups = useCallback(() => {
        return getPlugins("pb-editor-page-element-group");
    }, []);

    const getGroupElements = useCallback(group => {
        return getPlugins("pb-page-element").filter(
            (el: PbElementPluginType) => el.toolbar && el.toolbar.group === group
        );
    }, []);

    const [group, setGroup] = useState(getGroups()[0].name);

    const { theme } = usePageBuilder();

    const refresh = useCallback(() => {
        setGroup(group);
    }, []);

    const enableDragOverlay = useCallback(() => {
        const el = document.querySelector(".pb-editor");
        if (el) {
            el.classList.add("pb-editor-dragging");
        }
    }, []);

    const disableDragOverlay = useCallback(() => {
        const el = document.querySelector(".pb-editor");
        if (el) {
            el.classList.remove("pb-editor-dragging");
        }
    }, []);

    const renderDraggable = useCallback(
        (element, plugin) => {
            const { elementType } = plugin;

            return (
                <Draggable
                    key={plugin.name}
                    target={plugin.target}
                    beginDrag={props => {
                        dragStart({ element: { type: elementType } });
                        setTimeout(
                            () =>
                                deactivatePlugin({
                                    name: ADD_ELEMENT
                                }),
                            20
                        );
                        return { type: elementType, target: props.target };
                    }}
                    endDrag={(props, monitor) => {
                        dragEnd({ element: monitor.getItem() });
                    }}
                >
                    {({ drag }) => (
                        <div ref={drag}>{renderOverlay(element, null, "Drag to Add")}</div>
                    )}
                </Draggable>
            );
        },
        [dragStart, deactivatePlugin, dragEnd]
    );

    const renderOverlay = useCallback(
        (element, onClick = null, label) => {
            return (
                <Styled.ElementPreview>
                    <Styled.Overlay>
                        <Styled.Backdrop className={"backdrop"} />
                        <Styled.AddBlock className={"add-block"}>
                            <ButtonFloating
                                onClick={onClick}
                                label={label}
                                icon={<AddIcon />}
                                onMouseDown={enableDragOverlay}
                                onMouseUp={disableDragOverlay}
                            />
                        </Styled.AddBlock>
                    </Styled.Overlay>
                    {element}
                </Styled.ElementPreview>
            );
        },
        [enableDragOverlay, disableDragOverlay]
    );

    const renderClickable = useCallback(
        (element, plugin) => {
            const item = renderOverlay(
                element,
                () => {
                    dropElement({
                        source: { type: plugin.elementType },
                        target: { ...params }
                    });
                    deactivatePlugin({
                        name: ADD_ELEMENT
                    });
                },
                "Click to Add"
            );

            return React.cloneElement(item, { key: plugin.name });
        },
        [params, deactivatePlugin, dropElement, renderOverlay]
    );

    return (
        <Styled.Flex>
            <List className={categoriesList}>
                {getGroups().map(plugin => (
                    <ListItem
                        onClick={() => setGroup(plugin.name)}
                        key={plugin.name}
                        className={plugin.name === group && "active"}
                    >
                        {plugin.group.title}

                        {plugin.group.icon && (
                            <ListItemMeta>
                                <Icon icon={plugin.group.icon} />
                            </ListItemMeta>
                        )}
                    </ListItem>
                ))}
            </List>
            <Styled.Elements>
                {group &&
                    getGroupElements(group).map(plugin => {
                        return (params ? renderClickable : renderDraggable)(
                            <div data-role="draggable">
                                <Styled.ElementBox>
                                    <Styled.ElementTitle>
                                        {typeof plugin.toolbar.title === "function" ? (
                                            plugin.toolbar.title({ refresh })
                                        ) : (
                                            <Typography use="overline">
                                                {plugin.toolbar.title}
                                            </Typography>
                                        )}
                                    </Styled.ElementTitle>
                                    <Styled.ElementPreviewCanvas>
                                        {plugin.toolbar.preview({ theme })}
                                    </Styled.ElementPreviewCanvas>
                                </Styled.ElementBox>
                            </div>,
                            plugin
                        );
                    })}
            </Styled.Elements>
        </Styled.Flex>
    );
};

export default connect(
    state => {
        const getParams = getActivePluginParams("pb-editor-toolbar-add-element");
        return {
            params: getParams ? getParams(state) : null
        };
    },
    { dragStart, dragEnd, deactivatePlugin, dropElement }
)(AddElement);
