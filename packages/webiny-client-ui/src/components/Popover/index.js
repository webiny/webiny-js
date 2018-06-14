import React from "react";
import _ from "lodash";
import $ from "jquery";
import { inject } from "webiny-client";
import "./styles.scss";
import ReactDOMServer from "react-dom/server";

@inject()
class Popover extends React.Component {
    componentDidMount() {
        this.initPopover.call(this);
    }

    componentDidUpdate() {
        this.initPopover.call(this);
    }

    initPopover() {
        $(this.dom).popover({
            html: true,
            trigger: this.props.trigger,
            placement: this.props.placement
        });
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        let html = this.props.children;
        if (!_.isString(html)) {
            html = ReactDOMServer.renderToStaticMarkup(this.props.children);
        }
        return (
            <span ref={ref => (this.dom = ref)} title={this.props.title} data-content={html}>
                {this.props.target}
            </span>
        );
    }
}

Popover.defaultProps = {
    title: null,
    trigger: "hover",
    placement: "right"
};

export default Popover;
