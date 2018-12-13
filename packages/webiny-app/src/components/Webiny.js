// @flow
import React from "react";
import { ApolloProvider } from "react-apollo";
import { router } from "../router";
import { UiProvider } from "./Ui";
import { getPlugins } from "webiny-plugins";

type WebinyProps = { config: Object, children: Function };

const { Provider, Consumer } = React.createContext();

export const ConfigProvider = ({ config, children }: Object) => {
    return <Provider value={config}>{children}</Provider>;
};

export const ConfigConsumer = ({ children }: Object) => (
    <Consumer>{config => React.cloneElement(children, { config })}</Consumer>
);

class Webiny extends React.Component<WebinyProps> {
    constructor(props: Object) {
        super();
        getPlugins("webiny-init").forEach(plugin => {
            plugin.callback();
        });

        // Setup router
        router.configure(props.config.router);
        getPlugins("route").forEach((pl: Object) => {
            router.addRoute(pl.route);
        });
    }

    render() {
        const { config, children } = this.props;

        return (
            <ApolloProvider client={config.apolloClient}>
                <UiProvider>
                    <ConfigProvider config={config}>{children({ router, config })}</ConfigProvider>
                </UiProvider>
            </ApolloProvider>
        );
    }
}

export default Webiny;
