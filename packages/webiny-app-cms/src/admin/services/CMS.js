// @flow
import _ from "lodash";
import { app } from "webiny-app";

export type WidgetGroup = {
    name: string,
    title: string,
    icon: string | Array<string>
};

export type EditorWidget = {
    type: string,
    title: string,
    icon: Array<string>,
    data: ?Object,
    settings: ?Object,
    renderWidget: Function,
    renderSettings?: Function
};

export type Widget = {
    type: string,
    render: Function
};

class CMS {
    /**
     * @private
     */
    widgets: Array<Widget>;
    /**
     * @private
     */
    widgetGroups: Array<WidgetGroup>;
    /**
     * @private
     */
    editorWidgets: { [group: string]: Array<EditorWidget> };

    constructor() {
        this.widgets = [];
        this.widgetGroups = [];
        this.editorWidgets = {};
    }

    addWidgetGroup(group: WidgetGroup) {
        this.widgetGroups.push(group);
    }

    addEditorWidget(group: string, widget: EditorWidget) {
        this.editorWidgets[group] = this.editorWidgets[group] || [];
        this.editorWidgets[group].push(widget);
    }

    addWidget(widget: Widget) {
        this.widgets.push(widget);
    }

    getWidget(type: string) {
        return _.find(this.widgets, { type });
    }

    getWidgetGroups() {
        return this.widgetGroups;
    }

    getEditorWidgets(group: ?string) {
        return group ? this.editorWidgets[group] || [] : this.editorWidgets;
    }

    getEditorWidget(type: string, extraFilters: Object = {}) {
        return _.find(_.flatten(Object.values(this.editorWidgets)), { type, ...extraFilters });
    }

    createGlobalWidget(data: Object) {
        const createWidget = app.graphql.generateCreate("CmsWidget", "id");
        return createWidget({ variables: { data } }).then(({ data: { id } }) => {
            // Register new global widget
            const widgetDefinition = this.getEditorWidget(data.type);
            this.addEditorWidget("global", {
                ..._.cloneDeep(widgetDefinition),
                ...data,
                origin: id
            });

            return id;
        });
    }

    updateGlobalWidget(id: string, data: Object) {
        const updateWidget = app.graphql.generateUpdate("CmsWidget", "id");
        return updateWidget({ variables: { id, data } }).then(() => {
            // Register new global widget
            const index = _.findIndex(this.editorWidgets.global, { origin: id });
            this.editorWidgets.global[index] = {
                ...this.editorWidgets.global[index],
                ...data
            };
        });
    }
}

export default CMS;
