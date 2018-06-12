import React from "react";
import _ from "lodash";
import { app, createComponent } from "webiny-client";

class Navigation extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            user: null,
            highlight: null,
            display: window.outerWidth > 768 ? "desktop" : "mobile"
        };

        this.auth = app.security;
        this.checkDisplayInterval = null;
    }

    componentDidMount() {
        if (this.auth) {
            // Navigation is rendered based on user roles so we need to watch for changes
            this.unwatch = this.auth.onIdentity(identity => {
                this.setState({ user: identity });
            });

            this.setState({ user: this.auth.identity });
        }

        this.checkDisplayInterval = setInterval(() => {
            this.setState({ display: window.outerWidth > 768 ? "desktop" : "mobile" });
        }, 500);
    }

    componentWillUnmount() {
        clearInterval(this.checkDisplayInterval);

        // Release data cursors
        this.unwatch && this.unwatch();
    }

    shouldComponentUpdate(nextProps, nextState) {
        return !_.isEqual(this.state, nextState);
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { Desktop, Mobile } = this.props.modules;
        const props = {
            highlight: this.state.highlight
        };

        if (this.state.display === "mobile") {
            return <Mobile {...props} />;
        }

        return <Desktop {...props} />;
    }
}

export default createComponent(Navigation, {
    modules: [
        "Link",
        {
            Desktop: "Admin.Navigation.Desktop",
            Mobile: "Admin.Navigation.Mobile"
        }
    ]
});
