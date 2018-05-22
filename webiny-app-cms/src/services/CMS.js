// @flow
import _ from "lodash";

export type Widget = {
    type: string,
    render: Function
};

class CMS {
    /**
     * @private
     */
    widgets: Array<Widget>;

    constructor() {
        this.widgets = [];
    }

    addWidget(widget: Widget) {
        this.widgets.push(widget);
    }

    getWidget(type: string) {
        return _.find(this.widgets, { type });
    }
}

export default CMS;
