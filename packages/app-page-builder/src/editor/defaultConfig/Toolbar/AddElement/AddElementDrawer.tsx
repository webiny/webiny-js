import React, { useCallback, useEffect, useMemo, useState } from "react";
import { css } from "emotion";
import isEqual from "lodash/isEqual";
import { Typography } from "@webiny/ui/Typography";
import { ButtonFloating } from "@webiny/ui/Button";
import * as Styled from "./StyledComponents";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import {
    DragEndActionEvent,
    DragStartActionEvent,
    DropElementActionEvent
} from "~/editor/recoil/actions";
import Draggable from "~/editor/components/Draggable";
import { plugins } from "@webiny/plugins";
import { usePageBuilder } from "~/hooks/usePageBuilder";
import { ReactComponent as AddIcon } from "~/editor/assets/icons/add.svg";
import { PbEditorPageElementGroupPlugin, PbEditorPageElementPlugin } from "~/types";
import { DropElementActionArgsType } from "~/editor/recoil/actions/dropElement/types";
import Accordion from "~/editor/plugins/elementSettings/components/Accordion";
import { useSnackbar } from "@webiny/app-admin";
import { AddElementButton } from "~/editor/plugins/elements/cell/AddElementButton";
import { useDrawer } from "~/editor/config/Toolbar/DrawerProvider";

const accordionStyle = css`
    & .icon-container svg {
        width: 24px !important;
        height: 24px !important;
    }
`;

type ElementsListProps = {
    groupPlugin: PbEditorPageElementGroupPlugin;
    elements: PbEditorPageElementPlugin[];
    renderDraggable: (element: any, plugin: any) => JSX.Element;
    refresh: () => void;
};

const ElementsList = ({ groupPlugin, elements, renderDraggable, refresh }: ElementsListProps) => {
    const { theme } = usePageBuilder();

    if (elements.length === 0) {
        return groupPlugin.group.emptyView || null;
    }

    return (
        <Styled.Elements>
            {elements.map(plugin => {
                const pluginToolbarTitle = plugin.toolbar ? plugin.toolbar.title : null;
                const pluginToolbarPreview =
                    plugin.toolbar && plugin.toolbar.preview
                        ? plugin.toolbar.preview
                        : () => {
                              return "";
                          };
                return renderDraggable(
                    <div data-role="draggable">
                        <Styled.ElementTitle>
                            {typeof pluginToolbarTitle === "function" ? (
                                pluginToolbarTitle({ refresh })
                            ) : (
                                <Typography use="overline">{pluginToolbarTitle}</Typography>
                            )}
                        </Styled.ElementTitle>
                        <Styled.ElementPreviewCanvas>
                            {pluginToolbarPreview({ theme })}
                        </Styled.ElementPreviewCanvas>
                    </div>,
                    plugin
                );
            })}
        </Styled.Elements>
    );
};

export const AddElementDrawer = () => {
    const drawer = useDrawer();
    const [params, setParams] = useState<DropElementActionArgsType["target"] | undefined>(
        undefined
    );
    const handler = useEventActionHandler();
    const elementPlugins = plugins.byType<PbEditorPageElementPlugin>("pb-editor-page-element");
    const [elements, setElements] = useState(elementPlugins);
    const { showSnackbar } = useSnackbar();

    const onAddElement = useCallback(element => {
        setParams({
            id: element.id,
            type: element.type,
            path: element.path?.join("."),
            position: 0
        });
        drawer.open();
    }, []);

    const AddElementButtonDecorator = useMemo(() => {
        return AddElementButton.createDecorator(Original => {
            return function AddElementButton(props) {
                return <Original {...props} onClick={onAddElement} />;
            };
        });
    }, []);

    const refresh = useCallback(() => {
        setElements(elementPlugins);
    }, [elementPlugins]);

    useEffect(() => {
        if (!isEqual(elements, elementPlugins)) {
            refresh();
        }
    }, [elementPlugins]);

    const dragStart = useCallback(() => {
        handler.trigger(new DragStartActionEvent());
    }, []);
    const dragEnd = useCallback(() => {
        handler.trigger(new DragEndActionEvent());
    }, []);

    const dropElement = useCallback((args: DropElementActionArgsType) => {
        handler.trigger(new DropElementActionEvent(args));
        setParams(undefined);
        drawer.close();
    }, []);

    const getGroups = useCallback((): PbEditorPageElementGroupPlugin[] => {
        const allGroups = plugins.byType<PbEditorPageElementGroupPlugin>(
            "pb-editor-page-element-group"
        );

        // For backward compatibility with custom media plugins (if such were created by user)
        const isMediaGroupEmpty =
            plugins
                .byType<PbEditorPageElementPlugin>("pb-editor-page-element")
                .filter(el => el.toolbar && el.toolbar.group === "pb-editor-element-group-media")
                .length === 0;
        if (isMediaGroupEmpty) {
            return allGroups.filter(group => group.name !== "pb-editor-element-group-media");
        }

        return allGroups;
    }, []);

    const pageElementGroupPlugins = getGroups();

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

    const renderDraggable = useCallback(
        (element, plugin) => {
            const { elementType } = plugin;

            return (
                <Draggable
                    enabled={true}
                    key={plugin.name}
                    target={plugin.target}
                    beginDrag={props => {
                        dragStart();
                        return { type: elementType, target: props.target };
                    }}
                    endDrag={() => {
                        dragEnd();
                    }}
                >
                    {({ drag }) => (
                        <div ref={drag}>
                            {renderOverlay(
                                element,
                                params
                                    ? () => {
                                          // If there are restrictions on the types of elements that can be dropped, check them here.
                                          const selectedElementAllowedTargets = plugin.target;
                                          const targetedElement = params.type;

                                          const targetedElementPlugin = elementPlugins.find(
                                              p => p.elementType === targetedElement
                                          );

                                          if (!targetedElementPlugin?.canReceiveChildren) {
                                              showSnackbar(
                                                  "The currently active page element cannot receive child elements."
                                              );
                                              return;
                                          }

                                          const hasRestrictions =
                                              Array.isArray(selectedElementAllowedTargets) &&
                                              selectedElementAllowedTargets.length > 0;

                                          if (hasRestrictions) {
                                              const isAllowed =
                                                  selectedElementAllowedTargets.includes(
                                                      targetedElement
                                                  );

                                              if (!isAllowed) {
                                                  showSnackbar(
                                                      "The element cannot be dropped into the currently active page element."
                                                  );
                                                  return;
                                              }
                                          }

                                          dropElement({
                                              source: {
                                                  type: plugin.elementType,
                                                  target: undefined
                                              },
                                              target: params as DropElementActionArgsType["target"]
                                          });
                                          // setTimeout(deactivatePlugin, 20);
                                      }
                                    : null,
                                params ? "Click to Add" : "Drag to Add",
                                plugin
                            )}
                        </div>
                    )}
                </Draggable>
            );
        },
        [params, dropElement, renderOverlay]
    );

    return (
        <>
            <AddElementButtonDecorator />
            {pageElementGroupPlugins.map(plugin => (
                <Accordion
                    key={plugin.name}
                    title={plugin.group.title}
                    icon={plugin.group.icon}
                    className={accordionStyle}
                >
                    <ElementsList
                        groupPlugin={plugin}
                        elements={elements.filter(
                            el => el.toolbar && el.toolbar.group === plugin.name
                        )}
                        refresh={refresh}
                        renderDraggable={renderDraggable}
                    />
                </Accordion>
            ))}
        </>
    );
};
