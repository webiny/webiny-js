import React from "react";
import _ from "lodash";
import invariant from "invariant";
import { createComponent } from "webiny-app";
import blankBalloon from "./assets/blank-state-balloon.jpg";

class PageContentPreview extends React.Component {
    renderPreviewWidget(data) {
        const widget = { ...data };
        const {
            services: { cms },
            modules: { Alert }
        } = this.props;
        const widgetData = cms.getWidget(widget.type);
        invariant(widgetData, `Missing widget definition for type "${widget.type}"`);

        if (widget.origin) {
            const wd = cms.getEditorWidget(widget.type, { origin: widget.origin });
            if (!wd) {
                return (
                    <Alert type={"danger"} key={widget.id}>
                        Missing widget for type <strong>{widget.type}</strong>
                    </Alert>
                );
            }
            if (!widget.data) {
                widget.data = _.cloneDeep(wd.data);
            }

            if (!widget.settings) {
                widget.settings = _.cloneDeep(wd.settings);
            }
        }

        const preview = widgetData.widget.render({ widget });

        return (
            <div key={widget.id}>{preview ? React.cloneElement(preview, { widget }) : null}</div>
        );
    }

    render() {
        const { styles } = this.props;
        return (
            <React.Fragment>
                {!this.props.content.length && (
                    <div className={styles.emptyPlaceholder}>
                        <div className={styles.emptyContent}>
                            <img src={blankBalloon} alt="" />
                            <h3>This revision seems to be empty!</h3>
                        </div>
                    </div>
                )}
                {this.props.content.length > 0 &&
                    this.props.content.map(this.renderPreviewWidget.bind(this))}
            </React.Fragment>
        );
    }
}

export default createComponent(PageContentPreview, { modules: ["Alert"], services: ["cms"] });
