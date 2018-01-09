import React from 'react';
import $ from 'jquery';
import {Webiny} from 'webiny-client';
import TooltipContent from './TooltipContent';

class Tooltip extends Webiny.Ui.Component {
    constructor() {
        super();
        this.ref = null;
        this.state = {
            click: {
                target: false
            },
            hover: {
                target: false,
                content: false
            }
        };
        this.bindMethods('onClick,onMouseEnter,onMouseLeave,onContentEnter,onContentLeave');
    }

    componentDidMount() {
        super.componentDidMount();
        // We attach different event listeners, depending on received 'trigger' prop.
        switch (this.props.trigger) {
            case 'click':
                $(this.ref).first().on('click', this.onClick);
                break;
            default: // Hover
                $(this.ref).first().on('mouseenter', this.onMouseEnter);
                $(this.ref).first().on('mouseleave', this.onMouseLeave);
        }
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        $(this.ref).first().off();
    }

    onClick() {
        this.setState(state => {
            const click = state.click;
            click.target = !click.target;
            return {click};
        });
    }

    onMouseEnter() {
        this.setState(state => {
            const hover = state.hover;
            hover.target = true;
            return {hover};
        });
    }

    onMouseLeave() {
        this.setState(state => {
            const hover = state.hover;
            hover.target = false;
            return {hover};
        });
    }

    onContentEnter() {
        this.setState(state => {
            const hover = state.hover;
            hover.content = true;
            return {hover};
        });
    }

    onContentLeave() {
        this.setState(state => {
            const hover = state.hover;
            hover.content = false;
            return {hover};
        });
    }

    /**
     * Tells us if tooltip content must be in the DOM, conditions depend on received 'trigger' prop.
     * @returns {boolean}
     */
    mustShowTooltipContent() {
        switch (this.props.trigger) {
            case 'click':
                return this.state.click.target;
                break;
            default: // hover
                return this.state.hover.target;
        }
    }
}

Tooltip.defaultProps = {
    placement: 'right',
    trigger: 'hover',
    target: null,
    renderer() {
        return (
            <tooltip ref={ref => this.ref = ref}>
                {this.props.target}
                {this.mustShowTooltipContent() && (
                    <TooltipContent
                        trigger={this.props.trigger}
                        onOutsideClick={this.onClick}
                        onMouseEnter={this.onContentEnter}
                        onMouseLeave={this.onContentLeave}
                        content={this.props.children}
                        placement={this.props.placement}
                        targetFirstChildElement={this.ref.firstChild}/>
                )}
            </tooltip>
        );
    }
};

export default Webiny.createComponent(Tooltip);