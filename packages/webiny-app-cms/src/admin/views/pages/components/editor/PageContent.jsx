import React from "react";
import _ from "lodash";
import { createComponent } from "webiny-app";
import shortid from "shortid";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Widget from "./Widget";
import PreviewWidget from "./PreviewWidget";
import WidgetSettings from "./WidgetSettings";
import styles from "./PageContent.scss";

class PageContent extends React.Component {
    constructor(props) {
        super();
        this.state = {
            activeWidget: null,
            dragging: false
        };

        this.cms = props.services.cms;
        this.removeWidget = this.removeWidget.bind(this);
        this.beforeRemoveWidget = this.beforeRemoveWidget.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
        this.reorder = this.reorder.bind(this);
        this.move = this.move.bind(this);
        this.getList = this.getList.bind(this);
        this.widgetClicked = this.widgetClicked.bind(this);
    }

    beforeRemoveWidget({ widget }) {
        const editorWidget = this.cms.getEditorWidget(widget.type);
        if (typeof editorWidget.removeWidget === "function" && !widget.origin) {
            return editorWidget.removeWidget(widget);
        }
        return Promise.resolve();
    }

    removeWidget({ id }) {
        const widgets = _.cloneDeep(this.props.value);
        widgets.splice(_.findIndex(widgets, { id }), 1);
        this.props.onChange(widgets);
    }

    onWidgetChange(widgetId, data) {
        const { value } = this.props;
        const index = _.findIndex(value, { id: widgetId });
        const widget = value[index];

        value[index] = { ..._.cloneDeep(widget), data };

        this.props.onChange(value);
    }

    // ======== DRAGGING METHODS ========

    // a little function to help us with reordering the result
    reorder(list, startIndex, endIndex) {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);

        return result;
    }

    /**
     * Moves an item from one list to another list.
     */
    move(source, destination, droppableSource, droppableDestination) {
        const sourceClone = Array.from(source);
        const destClone = Array.from(destination);

        const sourceWidget = this.cms.getEditorWidget(sourceClone[droppableSource.index].type);

        const widget = { data: sourceWidget.data, type: sourceWidget.type, id: shortid.generate() };
        
        destClone.splice(droppableDestination.index, 0, widget);

        return destClone;
    }

    getList(id) {
        if (id !== "content") {
            return this.cms.getEditorWidgets(id);
        }

        return this.props.value;
    }

    onDragEnd(result) {
        const { source, destination } = result;

        // dropped outside the list
        if (!destination) {
            // Delete the widget
            const items = Array.from(this.getList(source.droppableId));
            items.splice(source.index, 1);
            return this.props.onChange(items);
        }

        if (source.droppableId === destination.droppableId) {
            const items = this.reorder(
                this.getList(source.droppableId),
                source.index,
                destination.index
            );

            this.props.onChange(items);
        } else {
            const items = this.move(
                this.getList(source.droppableId),
                this.getList(destination.droppableId),
                source,
                destination
            );

            this.props.onChange(items);
        }
    }

    widgetClicked(widget) {
        this.setState(state => {
            return {
                activeWidget: widget.id === state.activeWidget ? null : widget.id
            };
        });
    }

    renderWidgetGroup(name) {
        return (
            <ul className={styles.editorWidgets}>
                <Droppable droppableId={name} isDropDisabled={true}>
                    {provided => (
                        <li ref={provided.innerRef}>
                            {this.cms.getEditorWidgets(name).map((widget, index) => (
                                <Draggable
                                    key={widget.type}
                                    draggableId={widget.type}
                                    index={index}
                                >
                                    {provided => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                        >
                                            <Widget index={index} widget={widget} />
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                        </li>
                    )}
                </Droppable>
            </ul>
        );
    }

    render() {
        const {
            value,
            modules: { Tabs, ViewSwitcher, Grid, Icon }
        } = this.props;

        const getListStyle = isDraggingOver => ({
            padding: 25,
            background: isDraggingOver ? "lightblue" : null
        });

        const activeWidget = this.state.activeWidget;

        return (
            <ViewSwitcher onReady={actions => (this.viewSwitcher = actions)}>
                <ViewSwitcher.View name={"content"} defaultView>
                    {() => (
                        <React.Fragment>
                            <Grid.Row>
                                <div className={styles.editorContainer}>
                                    <DragDropContext onDragEnd={this.onDragEnd}>
                                        <div className={styles.widgetsSidebar}>
                                            <ul>
                                                {this.cms
                                                    .getWidgetGroups()
                                                    .map(({ name, title, icon }) => {
                                                        return (
                                                            <li key={name}>
                                                                <Icon icon={icon} /> {title}
                                                                {this.renderWidgetGroup(name)}
                                                            </li>
                                                        );
                                                    })}
                                            </ul>
                                        </div>
                                        <Droppable
                                            droppableId="content"
                                            placeholder={{
                                                display: "block",
                                                tagName: "div",
                                                client: { width: "100%", height: 50 }
                                            }}
                                        >
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    className={styles.editorContent}
                                                    style={getListStyle(snapshot.isDraggingOver)}
                                                >
                                                    {value.map((widget, index) => (
                                                        <Draggable
                                                            key={widget.id}
                                                            draggableId={widget.id}
                                                            index={index}
                                                        >
                                                            {provided => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    style={{
                                                                        ...provided.draggableProps
                                                                            .style,
                                                                        padding: 20,
                                                                        backgroundColor: "white",
                                                                        opacity:
                                                                            !activeWidget ||
                                                                            (activeWidget &&
                                                                                activeWidget ===
                                                                                    widget.id)
                                                                                ? 1
                                                                                : 0.3
                                                                    }}
                                                                >
                                                                    <PreviewWidget
                                                                        onChange={data =>
                                                                            this.onWidgetChange(
                                                                                this.state.activeWidget,
                                                                                data
                                                                            )
                                                                        }
                                                                        onClick={_.noop}
                                                                        key={widget.id}
                                                                        widget={widget}
                                                                    />
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </DragDropContext>
                                    <div className={styles.editorSidebar}>
                                        <Tabs>
                                            <Tabs.Tab label={"Settings"}>
                                                {this.state.activeWidget && (
                                                    <WidgetSettings
                                                        key={this.state.activeWidget}
                                                        onChange={data =>
                                                            this.onWidgetChange(
                                                                this.state.activeWidget,
                                                                data
                                                            )
                                                        }
                                                        widget={_.find(this.props.value, {
                                                            id: this.state.activeWidget
                                                        })}
                                                    />
                                                )}
                                            </Tabs.Tab>
                                            <Tabs.Tab label={"Model"}>
                                                {JSON.stringify(value, null, 2)}
                                            </Tabs.Tab>
                                        </Tabs>
                                    </div>
                                </div>
                            </Grid.Row>
                            {/*<Grid.Row>
                                <Grid.Col all={12}>
                                    <pre>{JSON.stringify(this.props.value, null, 2)}</pre>
                                </Grid.Col>
                            </Grid.Row>*/}
                        </React.Fragment>
                    )}
                </ViewSwitcher.View>
            </ViewSwitcher>
        );
    }
}

export default createComponent(PageContent, {
    modules: ["Grid", "Tabs", "ViewSwitcher", "Icon"],
    services: ["cms"]
});
