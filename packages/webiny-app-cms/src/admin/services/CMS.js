// @flow
import _ from "lodash";
import { app } from "webiny-app";
import type { Widget, EditorWidget } from "webiny-app-cms";

export type WidgetGroup = {
    name: string,
    title: string,
    icon: string | Array<string>
};

export type WidgetData = {
    type: string,
    group: string,
    title: string,
    icon: string | Array<string>,
    widget: EditorWidget
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
    editorWidgets: Array<WidgetData>;

    constructor() {
        this.widgets = [];
        this.widgetGroups = [];
        this.editorWidgets = [];
    }

    addWidgetGroup(group: WidgetGroup) {
        this.widgetGroups.push(group);
    }

    addEditorWidget(widget: WidgetData) {
        this.editorWidgets.push(widget);
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
        return group ? this.editorWidgets.filter(w => w.group === group) : this.editorWidgets;
    }

    getEditorWidget(type: string, extraFilters: Object = {}) {
        return _.find(this.editorWidgets, { type, ...extraFilters });
    }

    createGlobalWidget(data: Object) {
        const createWidget = app.graphql.generateCreate("CmsWidget", "id");
        return createWidget({ variables: { data } }).then(({ data: { id } }) => {
            // Register new global widget
            const widgetDefinition = this.getEditorWidget(data.type);
            this.addEditorWidget({
                type: "global",
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
            const index = _.findIndex(this.editorWidgets, { group: "global", origin: id });
            this.editorWidgets[index] = {
                ...this.editorWidgets[index],
                ...data
            };
        });
    }

    deleteGlobalWidget(id: string) {
        const deleteWidget = app.graphql.generateDelete("CmsWidget", "id");
        return deleteWidget({ variables: { id } }).then(() => {
            const index = _.findIndex(this.editorWidgets, { group: "global", origin: id });
            this.editorWidgets.splice(index, 1);
        });
    }
}

export default CMS;
