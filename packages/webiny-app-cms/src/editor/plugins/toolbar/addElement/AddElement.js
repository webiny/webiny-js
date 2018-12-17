//@flow
import * as React from "react";
import { connect } from "webiny-app-cms/editor/redux";
import { compose, withHandlers } from "recompose";
import Draggable from "webiny-app-cms/editor/components/Draggable";
import { dragStart, dragEnd, deactivatePlugin, dropElement } from "webiny-app-cms/editor/actions";
import { getPlugins } from "webiny-plugins";
import { getActivePluginParams } from "webiny-app-cms/editor/selectors";
import { withCms } from "webiny-app-cms/context";
import * as Styled from "./StyledComponents";
import { css } from "emotion";
import { List, ListItem, ListItemMeta } from "webiny-ui/List";
import { Icon } from "webiny-ui/Icon";
import { Typography } from "webiny-ui/Typography";
import { ButtonFloating } from "webiny-ui/Button";
import { ReactComponent as AddIcon } from "webiny-app-cms/editor/assets/icons/add.svg";
import type {
    CmsProviderPropsType,
    ElementPluginType,
    ElementGroupPluginType
} from "webiny-app-cms/types";

const ADD_ELEMENT = "cms-toolbar-add-element";

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
    cms: CmsProviderPropsType,
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

    getGroups(): Array<ElementGroupPluginType> {
        return getPlugins("cms-element-group");
    }

    getGroupElements(group: string) {
        return getPlugins("cms-element").filter(
            (el: ElementPluginType) => el.toolbar && el.toolbar.group === group
        );
    }

    renderDraggable = (element, plugin) => {
        const { name } = plugin;
        const { dragStart, deactivatePlugin, dragEnd } = this.props;

        return (
            <Draggable
                key={plugin.name}
                target={plugin.target}
                beginDrag={props => {
                    dragStart({ element: { type: name } });
                    setTimeout(
                        () =>
                            deactivatePlugin({
                                name: ADD_ELEMENT
                            }),
                        20
                    );
                    return { type: name, target: props.target };
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
                    source: { type: plugin.name },
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
            cms: { theme }
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
        state => ({
            params: getActivePluginParams("cms-toolbar-add-element")(state)
        }),
        { dragStart, dragEnd, deactivatePlugin, dropElement }
    ),
    withCms(),
    withHandlers({
        enableDragOverlay: () => () => {
            const el = document.querySelector(".cms-editor");
            if (el) {
                el.classList.add("cms-editor-dragging");
            }
        },
        disableDragOverlay: () => () => {
            const el = document.querySelector(".cms-editor");
            if (el) {
                el.classList.remove("cms-editor-dragging");
            }
        }
    })
)(AddElement);
