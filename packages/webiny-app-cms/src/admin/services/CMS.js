// @flow
import _ from "lodash";

export type WidgetGroup = {
    type: string,
    title: string,
    icon: string | Array<string>
};

export type EditorWidget = {
    type: string,
    title: string,
    icon: Array<string>,
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

    getEditorWidget(type: string) {
        return _.find(_.flatten(Object.values(this.editorWidgets)), { type });
    }
}

export default CMS;
