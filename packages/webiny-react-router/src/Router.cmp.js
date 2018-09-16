// @flow
import React from "react";
import $ from "jquery";
import parse from "url-parse";

class Router extends React.Component<*, *> {
    state = {
        route: null
    };

    unlisten = null;

    componentDidMount() {
        const { router } = this.props;
        const { history } = router;

        this.unlisten = history.listen(() => {
            router.matchRoute(history.location.pathname).then(route => {
                this.setState({ route });
            });
        });

        $(document)
            .off("click", "a")
            .on("click", "a", function(e) {
                if (this.href.endsWith("#") || this.target === "_blank") {
                    return;
                }

                // Check if it's an anchor link
                if (this.href.indexOf("#") > -1) {
                    return;
                }

                if (this.href.startsWith(window.location.origin)) {
                    e.preventDefault();

                    let url = parse(this.href, true);
                    history.push(url.pathname, router.config.basename);
                }
            });

        router.matchRoute(history.location.pathname).then(route => {
            this.setState({ route });
        });
    }

    UNSAFE_componentWillReceiveProps(props: Object) {
        props.router.matchRoute(props.router.history.location.pathname).then(route => {
            if (typeof this.unlisten === "function") {
                this.setState({ route });
            }
        });
    }

    componentWillUnmount() {
        this.unlisten && this.unlisten();
        this.unlisten = null;
    }

    render() {
        return this.state.route;
    }
}

export default Router;
