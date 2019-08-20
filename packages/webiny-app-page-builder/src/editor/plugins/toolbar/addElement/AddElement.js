//@flow
import * as React from "react";
import { connect } from "webiny-app-page-builder/editor/redux";
import { compose, withHandlers } from "recompose";
import Draggable from "webiny-app-page-builder/editor/components/Draggable";
import { dragStart, dragEnd, deactivatePlugin, dropElement } from "webiny-app-page-builder/editor/actions";
import { getPlugins } from "webiny-plugins";
import { getActivePluginParams } from "webiny-app-page-builder/editor/selectors";
import { withPageBuilder } from "webiny-app-page-builder/context";
import * as Styled from "./StyledComponents";
import { css } from "emotion";
import { List, ListItem, ListItemMeta } from "webiny-ui/List";
import { Icon } from "webiny-ui/Icon";
import { Typography } from "webiny-ui/Typography";
import { ButtonFloating } from "webiny-ui/Button";
import { ReactComponent as AddIcon } from "webiny-app-page-builder/editor/assets/icons/add.svg";
import type {
    PbElementPluginType,
    PbElementGroupPluginType
} from "webiny-app-page-builder/types";
import type { PbProviderPropsType } from "webiny-app-page-builder/context";

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

type Props = {
    dragStart: Function,
    dragEnd: Function,
    deactivatePlugin: Function,
    dropElement: Function,
    params: Object | null,
    pageBuilder: PbProviderPropsType,
    enableDragOverlay: Function,
    disableDragOverlay: Function
};

type State = {
    group: string | null
};

class AddElement extends React.Component<Props, State> {
    state = {
        group: this.getGroups()[0].name
    };

    getGroups(): Array<PbElementGroupPluginType> {
        return getPlugins("pb-editor-page-element-group");
    }

    getGroupElements(group: string) {
        return getPlugins("pb-page-element").filter(
            (el: PbElementPluginType) => el.toolbar && el.toolbar.group === group
        );
    }

    renderDraggable = (element, plugin) => {
        const { elementType } = plugin;
        const { dragStart, deactivatePlugin, dragEnd } = this.props;

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
                {({ connectDragSource }) =>
                    connectDragSource(<div>{this.renderOverlay(element, null, "Drag to Add")}</div>)
                }
            </Draggable>
        );
    };

    renderClickable = (element, plugin) => {
        const { params, dropElement, deactivatePlugin } = this.props;

        const item = this.renderOverlay(
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
    };

    renderOverlay = (element, onClick = null, label) => {
        const { enableDragOverlay, disableDragOverlay } = this.props;
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
    };

    refresh = () => {
        this.setState({ group: this.state.group });
    };

    render() {
        const {
            params,
            pageBuilder: { theme }
        } = this.props;

        return (
            <Styled.Flex>
                <List className={categoriesList}>
                    {this.getGroups().map(plugin => (
                        <ListItem
                            onClick={() => this.setState({ group: plugin.name })}
                            key={plugin.name}
                            className={plugin.name === this.state.group && "active"}
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
                    {this.state.group &&
                        this.getGroupElements(this.state.group).map(plugin => {
                            return (params ? this.renderClickable : this.renderDraggable)(
                                <div data-role="draggable">
                                    <Styled.ElementBox>
                                        <Styled.ElementTitle>
                                            {typeof plugin.toolbar.title === "function" ? (
                                                plugin.toolbar.title({ refresh: this.refresh })
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
    }
}

export default compose(
    connect(
        state => {
            const getParams = getActivePluginParams("pb-editor-toolbar-add-element");
            return {
                params: getParams ? getParams(state) : null
            };
        },
        { dragStart, dragEnd, deactivatePlugin, dropElement }
    ),
    withPageBuilder(),
    withHandlers({
        enableDragOverlay: () => () => {
            const el = document.querySelector(".pb-editor");
            if (el) {
                el.classList.add("pb-editor-dragging");
            }
        },
        disableDragOverlay: () => () => {
            const el = document.querySelector(".pb-editor");
            if (el) {
                el.classList.remove("pb-editor-dragging");
            }
        }
    })
)(AddElement);
