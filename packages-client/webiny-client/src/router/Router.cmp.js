import $ from "jquery";
import React from "react";
import parse from "url-parse";

class Router extends React.Component {
    constructor() {
        super();
        this.state = {
            route: null
        };
    }

    componentWillMount() {
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
                if (this.href.startsWith("javascript:void(0)") || this.href.endsWith("#")) {
                    return;
                }

                // Check if it's an anchor link
                if (this.href.indexOf("#") > -1) {
                    return;
                }

                e.preventDefault();

                let url = parse(this.href, true);
                history.push(url.pathname);
            });

        router.matchRoute(history.location.pathname).then(route => {
            this.setState({ route });
        });
    }

    componentWillReceiveProps(props) {
        props.router.matchRoute(props.router.history.location.pathname).then(route => {
            if (typeof this.unlisten === "function") {
                this.setState({ route });
            }
        });
    }

    componentWillUnmount() {
        this.unlisten();
        this.unlisten = null;
    }

    render() {
        return this.state.route;
    }
}

export default Router;
