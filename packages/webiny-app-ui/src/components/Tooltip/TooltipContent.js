import React from "react";
import _ from "lodash";
import $ from "jquery";
import classSet from "classnames";
import styles from "./styles.css?prefix=TooltipContent";

class TooltipContent extends React.Component {
    constructor() {
        super();
        this.positioningInterval = null;
        this.ref = null;
        this.state = {
            style: { visibility: "hidden" }
        };
        this.onClick = this.onClick.bind(this);
        this.setupPlacement = this.setupPlacement.bind(this);
        this.mounted = false;
    }

    /**
     * During the first 500ms, we call the setupPlacement more frequently, every 50ms, because of the possible DOM changes in the child
     * components. After that, we assume components are ready, and then we reduce the frequency to 750ms.
     */
    componentDidMount() {
        this.mounted = true;
        this.positioningInterval = setInterval(this.setupPlacement, 50);
        setTimeout(() => {
            if (this.mounted) {
                clearInterval(this.positioningInterval);
                this.positioningInterval = setInterval(this.setupPlacement, 750);
                this.registerEventListeners();
            }
        }, 500);
    }

    componentWillUnmount() {
        this.mounted = false;
        this.unregisterEventListeners();
        clearInterval(this.positioningInterval);
    }

    setupPlacement() {
        if (!this.ref) {
            return;
        }

        const target = _.assign(
            {
                width: this.props.targetFirstChildElement.offsetWidth,
                height: this.props.targetFirstChildElement.offsetHeight
            },
            $(this.props.targetFirstChildElement).position()
        );

        const content = {
            width: this.ref.offsetWidth,
            height: this.ref.offsetHeight
        };

        const style = {};
        switch (this.props.placement) {
            case "bottomRight":
                style.top = target.top + target.height;
                style.left = target.left + target.width;
                break;
            case "bottom":
                style.top = target.top + target.height;
                style.left = target.left + -(content.width - target.width) / 2;
                break;
            case "bottomLeft":
                style.top = target.top + target.height;
                style.left = target.left - content.width;
                break;
            case "left":
                style.top = target.top + -(content.height - target.height) / 2;
                style.left = target.left - content.width;
                break;
            case "topLeft":
                style.top = target.top - content.height;
                style.left = target.left - content.width;
                break;
            case "top":
                style.top = target.top - content.height;
                style.left = target.left + -(content.width - target.width) / 2;
                break;
            case "topRight":
                style.top = target.top - content.height;
                style.left = target.left + target.width;
                break;
            default:
                // 'right'
                style.top = target.top + -(content.height - target.height) / 2;
                style.left = target.left + target.width;
        }

        this.setState({ style });
    }

    /**
     * If tooltip was triggered by 'click' event, then we want to watch for all outside clicks, to automatically close the tooltip.
     */
    registerEventListeners() {
        if (this.props.trigger === "click") {
            document.addEventListener("click", this.onClick);
        }
    }

    unregisterEventListeners() {
        if (this.props.trigger === "click") {
            document.removeEventListener("click", this.onClick);
        }
    }

    onClick(event) {
        if (!this.ref.contains(event.target)) {
            this.props.onOutsideClick();
        }
    }

    render() {
        return (
            <div
                style={this.state.style}
                className={classSet(
                    styles.content,
                    styles["content" + _.upperFirst(this.props.placement)]
                )}
                ref={ref => (this.ref = ref)}
                onMouseEnter={this.props.onMouseEnter}
                onMouseLeave={this.props.onMouseLeave}
            >
                <div className={styles.innerContent}>{this.props.content}</div>
            </div>
        );
    }
}

TooltipContent.defaultProps = {
    targetFirstChildElement: null,
    content: null,
    placement: "right",
    trigger: "hover",
    onOutsideClick: _.noop,
    onMouseEnter: _.noop,
    onMouseLeave: _.noop
};

export default TooltipContent;
