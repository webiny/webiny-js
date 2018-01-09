import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import $ from 'jquery';
import {Webiny} from 'webiny-client';
import './styles.scss';
import ReactDOMServer from 'react-dom/server';

class Popover extends Webiny.Ui.Component {

    componentDidMount() {
        super.componentDidMount();
        this.initPopover.call(this);
    }

    componentDidUpdate() {
        super.componentDidUpdate();
        this.initPopover.call(this);
    }

    initPopover() {
        $(ReactDOM.findDOMNode(this)).popover({
            html: true,
            trigger: this.props.trigger,
            placement: this.props.placement
        });
    }
}

Popover.defaultProps = {
    title: null,
    trigger: 'hover',
    placement: 'right',
    renderer() {
        let html = this.props.children;
        if (!_.isString(html)) {
            html = ReactDOMServer.renderToStaticMarkup(this.props.children);
        }
        return (
            <span title={this.props.title} data-content={html}>
                {this.props.target}
            </span>
        );
    }
};

export default Webiny.createComponent(Popover);