import React from "react";
import _ from "lodash";
import invariant from "invariant";
import { createComponent } from "webiny-app";

class PageContentPreview extends React.Component {
    renderPreviewWidget(widget) {
        const { cms } = this.props.services;
        const widgetDefinition = cms.getWidget(widget.type);
        invariant(widgetDefinition, `Missing widget definition for type "${widget.type}"`);

        if (widget.origin) {
            const wd = cms.getEditorWidget(widget.type, { origin: widget.origin });
            widget = {
                ...widget,
                ..._.pick(wd, ["data", "settings"])
            };
        }

        return (
            <div key={widget.id}>
                {React.cloneElement(widgetDefinition.render(widget), { value: widget })}
            </div>
        );
    }

    render() {
        return (
            <React.Fragment>
                {this.props.content.map(this.renderPreviewWidget.bind(this))}
            </React.Fragment>
        );
    }
}

export default createComponent(PageContentPreview, { services: ["cms"] });
