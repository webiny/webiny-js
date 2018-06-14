import React from "react";
import _ from "lodash";
import hoistNonReactStatics from "hoist-non-react-statics";
import ErrorBoundary from "react-error-boundary";
import { app } from "./../index";
import LazyLoad from "./../components/LazyLoad";

const errorHandler = (error: Error, componentStack: string) => {
    console.error(error);
    console.log(componentStack);
};

/**
 * This function creates a wrapper class around given component to lazy-load and inject dependencies
 */
export default (Component, options = {}) => {
    // Create a copy of styles to use as default styles
    let defaultStyles = { ...options.styles };

    class InjectDeps extends React.Component {
        static configure(config) {
            // defaultProps are merged
            _.merge(InjectDeps.defaultProps, config.defaultProps || {});
            delete config.defaultProps;

            // modules are overwritten
            if (_.hasIn(config, "options.modules")) {
                InjectDeps.options.modules = config.options.modules;
                delete config.options.modules;
            }

            // Merge the rest
            _.merge(InjectDeps.options, config.options || {});

            // Create new defaultStyles object to hold modified styles
            defaultStyles = { ...InjectDeps.options.styles };
        }

        render() {
            const props = _.omit(this.props, ["styles"]);

            props.styles = { ...defaultStyles };

            // Inject services
            if (options.services) {
                props.services = options.services.reduce((services, name) => {
                    services[name] = app.services.get(name);
                    return services;
                }, {});
            }

            // If lazy loaded modules are defined - return LazyLoad wrapper
            const modules = options.modules || {};
            if (Object.keys(modules).length > 0) {
                return (
                    <LazyLoad modules={modules} options={{ props }}>
                        {modules => {
                            props["modules"] = modules;
                            return (
                                <ErrorBoundary onError={errorHandler}>
                                    <Component {...props} />
                                </ErrorBoundary>
                            );
                        }}
                    </LazyLoad>
                );
            }

            return (
                <ErrorBoundary onError={errorHandler}>
                    <Component {...props} />
                </ErrorBoundary>
            );
        }
    }

    InjectDeps.displayName = "InjectDeps";
    InjectDeps.__originalComponent = Component;
    InjectDeps.options = options;
    InjectDeps.defaultProps = _.assign({}, Component.defaultProps);

    return hoistNonReactStatics(InjectDeps, Component);
};
