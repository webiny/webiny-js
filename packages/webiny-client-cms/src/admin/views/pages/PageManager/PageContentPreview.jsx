import React from "react";
import invariant from "invariant";
import { inject } from "webiny-client";
import { WidgetContainer } from "webiny-client-cms";
import blankBalloon from "./assets/blank-state-balloon.jpg";

@inject({ modules: ["Alert"], services: ["cms"] })
class PageContentPreview extends React.Component {
    renderPreviewWidget(data) {
        const widget = { ...data };
        const {
            services: { cms }
        } = this.props;

        const widgetData = cms.getWidget(widget.type);
        invariant(widgetData, `Missing widget definition for type "${widget.type}"`);

        const widgetElement = widgetData.widget.render({ WidgetContainer, widget });
        return <div key={widget.id}>{React.cloneElement(widgetElement, { widget })}</div>;
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

export default PageContentPreview;
