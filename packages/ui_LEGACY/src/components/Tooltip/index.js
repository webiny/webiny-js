import React from "react";
import $ from "jquery";
import TooltipContent from "./TooltipContent";

class Tooltip extends React.Component {
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
        this.onClick = this.onClick.bind(this);
        this.onMouseEnter = this.onMouseEnter.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
        this.onContentEnter = this.onContentEnter.bind(this);
        this.onContentLeave = this.onContentLeave.bind(this);
    }

    componentDidMount() {
        // We attach different event listeners, depending on received 'trigger' prop.
        switch (this.props.trigger) {
            case "click":
                $(this.ref)
                    .first()
                    .on("click", this.onClick);
                break;
            default:
                // Hover
                $(this.ref)
                    .first()
                    .on("mouseenter", this.onMouseEnter);
                $(this.ref)
                    .first()
                    .on("mouseleave", this.onMouseLeave);
        }
    }

    componentWillUnmount() {
        $(this.ref)
            .first()
            .off();
    }

    onClick() {
        this.setState(state => {
            const click = state.click;
            click.target = !click.target;
            return { click };
        });
    }

    onMouseEnter() {
        this.setState(state => {
            const hover = state.hover;
            hover.target = true;
            return { hover };
        });
    }

    onMouseLeave() {
        this.setState(state => {
            const hover = state.hover;
            hover.target = false;
            return { hover };
        });
    }

    onContentEnter() {
        this.setState(state => {
            const hover = state.hover;
            hover.content = true;
            return { hover };
        });
    }

    onContentLeave() {
        this.setState(state => {
            const hover = state.hover;
            hover.content = false;
            return { hover };
        });
    }

    /**
     * Tells us if tooltip content must be in the DOM, conditions depend on received 'trigger' prop.
     * @returns {boolean}
     */
    mustShowTooltipContent() {
        switch (this.props.trigger) {
            case "click":
                return this.state.click.target;
            default:
                // hover
                return this.state.hover.target;
        }
    }

    render() {
        return (
            <span ref={ref => (this.ref = ref)}>
                {this.props.target}
                {this.mustShowTooltipContent() && (
                    <TooltipContent
                        trigger={this.props.trigger}
                        onOutsideClick={this.onClick}
                        onMouseEnter={this.onContentEnter}
                        onMouseLeave={this.onContentLeave}
                        content={this.props.children}
                        placement={this.props.placement}
                        targetFirstChildElement={this.ref.firstChild}
                    />
                )}
            </span>
        );
    }
}

Tooltip.defaultProps = {
    placement: "right",
    trigger: "hover",
    target: null
};

export default Tooltip;
