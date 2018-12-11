// @flow
import React from "react";
import parse from "url-parse";

class Router extends React.Component<*, *> {
    state = {
        route: null
    };

    unlisten = null;

    clickHandler = (event: Event) => {
        // $FlowFixMe
        const a = event.path.find(el => el.tagName === "A");
        if (!a) {
            return;
        }

        if (a.href.endsWith("#") || a.target === "_blank") {
            return;
        }

        // Check if it's an anchor link
        if (a.href.indexOf("#") > -1) {
            return;
        }

        if (a.href.startsWith(window.location.origin)) {
            event.preventDefault();
            const { router } = this.props;
            const { history } = router;
            let url = parse(a.href, true);
            history.push(url.pathname, router.config.basename);
        }
    };

    componentDidMount() {
        const { router } = this.props;
        const { history } = router;

        this.unlisten = history.listen(() => {
            router.matchRoute(history.location.pathname).then(route => {
                this.setState({ route });
            });
        });

        document.addEventListener("click", this.clickHandler);

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

        document.removeEventListener("click", this.clickHandler);
    }

    render() {
        return this.state.route;
    }
}

export default Router;
