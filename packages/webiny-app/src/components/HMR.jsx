import React from "react";

class HMR extends React.Component {
    constructor() {
        super();
        this.state = {
            hmr: Date.now()
        };

        if (process.env.NODE_ENV === "development") {
            this.hmr = {
                lastStatus: "idle"
            };

            this.hmrStatusHandler = status => {
                if (this.hmr.lastStatus === "apply" && status === "idle") {
                    this.setState({ hmr: Date.now() });
                }
                this.hmr.lastStatus = status;
            };

            // Handle hot-module-replacement
            if (module && module.hot) {
                module.hot.addStatusHandler(this.hmrStatusHandler);
            }
        }
    }

    componentWillUnmount() {
        if (process.env.NODE_ENV === "development") {
            module && module.hot.removeStatusHandler(this.hmrStatusHandler);
        }
    }

    render() {
        return this.props.children;
    }
}

export default HMR;
