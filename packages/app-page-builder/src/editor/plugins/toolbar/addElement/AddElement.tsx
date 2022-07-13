import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useRecoilValue } from "recoil";
import { css } from "emotion";
import { List, ListItem, ListItemMeta } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { Typography } from "@webiny/ui/Typography";
import { ButtonFloating } from "@webiny/ui/Button";
import * as Styled from "./StyledComponents";
import { activePluginParamsByNameSelector } from "~/editor/recoil/modules";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import {
    DeactivatePluginActionEvent,
    DragEndActionEvent,
    DragStartActionEvent,
    DropElementActionEvent
} from "~/editor/recoil/actions";
import Draggable from "~/editor/components/Draggable";
import { plugins } from "@webiny/plugins";
import { usePageBuilder } from "~/hooks/usePageBuilder";
import { ReactComponent as AddIcon } from "~/editor/assets/icons/add.svg";
import { PbEditorPageElementGroupPlugin, PbEditorPageElementPlugin } from "~/types";
import { useKeyHandler } from "~/editor/hooks/useKeyHandler";
import { DropElementActionArgsType } from "~/editor/recoil/actions/dropElement/types";

const ADD_ELEMENT = "pb-editor-toolbar-add-element";

// @ts-ignore
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

const AddElement: React.FC = () => {
    const handler = useEventActionHandler();
    const params = useRecoilValue(activePluginParamsByNameSelector(ADD_ELEMENT));
    const { removeKeyHandler, addKeyHandler } = useKeyHandler();

    const dragStart = useCallback(() => {
        handler.trigger(new DragStartActionEvent());
    }, []);
    const dragEnd = useCallback(() => {
        handler.trigger(new DragEndActionEvent());
    }, []);
    const deactivatePlugin = useCallback(() => {
        handler.trigger(
            new DeactivatePluginActionEvent({
                name: ADD_ELEMENT
            })
        );
    }, []);
    const dropElement = useCallback((args: DropElementActionArgsType) => {
        handler.trigger(new DropElementActionEvent(args));
    }, []);
    const getGroups = useCallback((): PbEditorPageElementGroupPlugin[] => {
        return plugins.byType<PbEditorPageElementGroupPlugin>("pb-editor-page-element-group");
    }, []);

    const pageElementGroupPlugins = getGroups();

    const getGroupElements = useCallback(group => {
        return plugins
            .byType<PbEditorPageElementPlugin>("pb-editor-page-element")
            .filter(el => el.toolbar && el.toolbar.group === group);
    }, []);

    const [group, setGroup] = useState<string>(
        pageElementGroupPlugins.length > 0 ? pageElementGroupPlugins[0].name || "" : ""
    );

    const { theme } = usePageBuilder();

    const refresh = useCallback(() => {
        setGroup(group);
    }, []);

    const enableDragOverlay = useCallback(() => {
        const el = document.querySelector(".pb-editor");
        if (!el) {
            return;
        }
        el.classList.add("pb-editor-dragging");
    }, []);

    const disableDragOverlay = useCallback(() => {
        const el = document.querySelector(".pb-editor");
        if (!el) {
            return;
        }
        el.classList.remove("pb-editor-dragging");
    }, []);

    const renderDraggable = useCallback((element, plugin) => {
        const { elementType } = plugin;

        return (
            <Draggable
                enabled={true}
                key={plugin.name}
                target={plugin.target}
                beginDrag={props => {
                    dragStart();
                    setTimeout(deactivatePlugin, 20);
                    return { type: elementType, target: props.target };
                }}
                endDrag={() => {
                    dragEnd();
                }}
            >
                {({ drag }) => (
                    <div ref={drag}>{renderOverlay(element, null, "Drag to Add", plugin)}</div>
                )}
            </Draggable>
        );
    }, []);

    const renderOverlay = useCallback(
        (element, onClick = null, label, plugin) => {
            return (
                <Styled.ElementPreview>
                    <Styled.Overlay>
                        <Styled.Backdrop className={"backdrop"} />
                        <Styled.AddBlock className={"add-block"}>
                            <ButtonFloating
                                data-testid={`pb-editor-add-element-button-${plugin.elementType}`}
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
                        source: { type: plugin.elementType } as any,
                        target: params as DropElementActionArgsType["target"]
                    });
                    deactivatePlugin();
                },
                "Click to Add",
                plugin
            );

            return React.cloneElement(item, { key: plugin.name });
        },
        [params, deactivatePlugin, dropElement, renderOverlay]
    );

    useEffect(() => {
        addKeyHandler("escape", e => {
            e.preventDefault();
            deactivatePlugin();
        });

        return () => removeKeyHandler("escape");
    });

    const emptyViewContent = useMemo((): React.ReactElement | null => {
        const selectedPlugin = pageElementGroupPlugins.find(pl => pl.name === group);
        if (!selectedPlugin) {
            return null;
        }
        return selectedPlugin.group.emptyView || null;
    }, [group]);

    const groupElements = group ? getGroupElements(group) : [];

    return (
        <Styled.Flex>
            <List className={categoriesList}>
                {pageElementGroupPlugins.map(plugin => (
                    <ListItem
                        onClick={() => setGroup(plugin.name || "")}
                        key={plugin.name}
                        className={plugin.name === group ? "active" : ""}
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
                {groupElements.length
                    ? groupElements.map(plugin => {
                          const pluginToolbarTitle = plugin.toolbar ? plugin.toolbar.title : null;
                          const pluginToolbarPreview =
                              plugin.toolbar && plugin.toolbar.preview
                                  ? plugin.toolbar.preview
                                  : () => {
                                        return "";
                                    };
                          return (params ? renderClickable : renderDraggable)(
                              <div data-role="draggable">
                                  <Styled.ElementBox>
                                      <Styled.ElementTitle>
                                          {typeof pluginToolbarTitle === "function" ? (
                                              pluginToolbarTitle({ refresh })
                                          ) : (
                                              <Typography use="overline">
                                                  {pluginToolbarTitle}
                                              </Typography>
                                          )}
                                      </Styled.ElementTitle>
                                      <Styled.ElementPreviewCanvas>
                                          {pluginToolbarPreview({ theme })}
                                      </Styled.ElementPreviewCanvas>
                                  </Styled.ElementBox>
                              </div>,
                              plugin
                          );
                      })
                    : emptyViewContent}
            </Styled.Elements>
        </Styled.Flex>
    );
};

export default React.memo(AddElement);
