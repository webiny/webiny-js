//@flow
import * as React from "react";
import { connect } from "react-redux";
import { compose } from "recompose";
import { ButtonFloating } from "webiny-ui/Button";
import Draggable from "webiny-app-cms/editor/components/Draggable";
import { dragStart, dragEnd, deactivatePlugin, dropElement } from "webiny-app-cms/editor/actions";
import { getPlugins } from "webiny-app/plugins";
import { getActivePluginParams } from "webiny-app-cms/editor/selectors";
import { withTheme } from "webiny-app-cms/editor/components";
import * as Styled from "./StyledComponents";
import { css } from "emotion";
import { List, ListItem, ListItemMeta } from "webiny-ui/List";
import { Icon } from "webiny-ui/Icon";
import { Typography } from "webiny-ui/Typography";
import { ReactComponent as AddIcon } from "webiny-app-cms/editor/assets/icons/add.svg";
import type { CmsThemeType, ElementPluginType, ElementGroupPluginType } from "webiny-app-cms/types";

const ADD_ELEMENT = "add-element";

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
    theme: CmsThemeType
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
            (el: ElementPluginType) => el.element.group === group
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
        return (
            <Styled.ElementPreview>
                <Styled.Overlay>
                    <Styled.Backdrop className={"backdrop"} />
                    <Styled.AddBlock className={"add-block"}>
                        <ButtonFloating small onClick={onClick} label={label} icon={<AddIcon />} />
                    </Styled.AddBlock>
                </Styled.Overlay>
                {element}
            </Styled.ElementPreview>
        );
    };

    render() {
        const { params, theme } = this.props;

        return (
            <React.Fragment>
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
                                    <div>
                                        <Styled.ElementBox>
                                            <Styled.ElementTitle>
                                                <Typography use="overline">
                                                    {plugin.element.title}
                                                </Typography>
                                            </Styled.ElementTitle>
                                            <Styled.ElementPreviewCanvas>
                                                {plugin.preview({ theme })}
                                            </Styled.ElementPreviewCanvas>
                                        </Styled.ElementBox>
                                    </div>,
                                    plugin
                                );
                            })}
                    </Styled.Elements>
                </Styled.Flex>
            </React.Fragment>
        );
    }
}

export default compose(
    connect(
        state => ({
            params: getActivePluginParams("cms-toolbar-bottom")(state)
        }),
        { dragStart, dragEnd, deactivatePlugin, dropElement }
    ),
    withTheme()
)(AddElement);
