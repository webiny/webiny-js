import React from "react";
import dynamics from "dynamics.js";
import _ from "lodash";
import { Transition } from "react-transition-group";

export default class Animate extends React.Component {
    static defaultProps = {
        mountOnEnter: false,
        unmountOnExit: false,
        onComplete: () => {},
        onEntered: () => {},
        onExited: () => {}
    };

    options = ["type", "duration", "friction", "frequency", "bounciness", "elasticity"];
    domNode = React.createRef();

    animationOptions = animation => {
        return {
            ..._.pick(animation, this.options),
            type: dynamics[animation.type],
            complete: () => {
                this.animationEnded();
                this.props.onComplete();
            },
            change: this.props.onChange,
            ...this.props.animationOptions
        };
    };

    onEnter = () => {
        dynamics.animate(
            this.domNode.current,
            _.omit(this.props.enterAnimation, this.options),
            this.animationOptions(this.props.enterAnimation)
        );
    };

    onExit = () => {
        dynamics.animate(
            this.domNode.current,
            _.omit(this.props.exitAnimation, this.options),
            this.animationOptions(this.props.exitAnimation)
        );
    };

    render() {
        return (
            <Transition
                in={this.props.trigger}
                mountOnEnter={this.props.mountOnEnter}
                unmountOnExit={this.props.unmountOnExit}
                onEnter={this.onEnter}
                onExit={this.onExit}
                onEntered={this.props.onEntered}
                onExited={this.props.onExited}
                addEndListener={(node, done) => {
                    this.animationEnded = done;
                }}
            >
                {() => this.props.children({ ref: this.domNode })}
            </Transition>
        );
    }
}
