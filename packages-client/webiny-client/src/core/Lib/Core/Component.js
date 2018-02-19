import _ from "lodash";
import React from "react";
import { Webiny } from "./../../../index";

class Component extends React.Component {
    constructor(props) {
        super(props);

        this.__mounted = true;
        this.bindMethods("isRendered");
    }

    static extendProps(props) {
        return _.merge({}, this.defaultProps, props);
    }

    componentWillMount() {
        // Reserved for future system-wide functionality
    }

    componentDidMount() {
        // Reserved for future system-wide functionality
        if (this.props.onComponentDidMount) {
            this.props.onComponentDidMount(this);
        }
    }

    /* eslint-disable */
    componentWillReceiveProps(nextProps) {
        // Reserved for future system-wide functionality
    }

    shouldComponentUpdate(nextProps, nextState) {
        // Reserved for future system-wide functionality
        return true;
    }

    componentWillUpdate(nextProps, nextState) {
        // Reserved for future system-wide functionality
    }

    componentDidUpdate(prevProps, prevState) {
        // Reserved for future system-wide functionality
    }

    /* eslint-enable */
    componentWillUnmount() {
        this.__mounted = false;
    }

    isMounted() {
        return this.__mounted;
    }

    isRendered() {
        if (_.has(this.props, "renderIf")) {
            return _.isFunction(this.props.renderIf) ? this.props.renderIf() : this.props.renderIf;
        }
        return true;
    }

    bindMethods(...methods) {
        if (methods.length === 1 && _.isString(methods[0])) {
            methods = methods[0].split(",").map(x => x.trim());
        }

        _.forEach(methods, name => {
            if (name in this) {
                this[name] = this[name].bind(this);
            } else {
                console.info("Missing method [" + name + "]", this);
            }
        });
    }

    render() {
        if (!this.isRendered()) {
            return null;
        }

        if (this.props.renderer) {
            try {
                return this.props.renderer.call(this, { props: this.props, state: this.state });
            } catch (e) {
                Webiny.Logger && Webiny.Logger.reportError("js", e.message, e.stack);
                if (DEVELOPMENT) {
                    const className = Object.getPrototypeOf(this).constructor.name;
                    console.error("[RENDER ERROR][" + className + "]", e);
                    return React.createElement("div", null, [
                        React.createElement(
                            "h3",
                            null,
                            "[RENDER ERROR] in component `" + className + "`"
                        ),
                        React.createElement("pre", null, e.stack)
                    ]);
                }
            }
        }

        return null;
    }
}

Component.defaultProps = {};

export default Component;
