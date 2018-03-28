import React from "react";
import _ from "lodash";
import hoistNonReactStatics from "hoist-non-react-statics";
import LazyLoad from "./../components/LazyLoad.cmp";

const hocCompose = components => {
    return props => {
        return components.reduce((Res, Cmp) => {
            if (!Res) {
                return React.createElement(Cmp, props);
            }

            return React.createElement(Cmp, props, Res);
        }, null);
    };
};

/**
 * This function creates a wrapper class around given component to allow component styling and lazy loading of dependencies
 */
export default (components, options = {}) => {
    const Component = Array.isArray(components) ? components[0] : components;
    const name = Array.isArray(components) ? components[0].name : components.name;

    // Create a copy of styles to use as default styles
    let defaultStyles = { ...options.styles };

    const createElement = hocCompose(Array.isArray(components) ? components : [components]);

    class ComponentWrapper extends React.Component {
        static configure(config) {
            // defaultProps are merged
            _.merge(ComponentWrapper.defaultProps, config.defaultProps || {});
            delete config.defaultProps;

            // modules are overwritten
            if (_.hasIn(config, "options.modules")) {
                ComponentWrapper.options.modules = config.options.modules;
                delete config.options.modules;
            }

            // Merge the rest
            _.merge(ComponentWrapper.options, config.options || {});

            // Create new defaultStyles object to hold modified styles
            defaultStyles = { ...ComponentWrapper.options.styles };
        }

        render() {
            const props = _.omit(this.props, ["styles"]);
            props.ref = c => (this.component = c);

            props.styles = { ...defaultStyles };

            // If new styles are given, merge them with default styles
            if (_.isPlainObject(this.props.styles)) {
                _.merge(props.styles, this.props.styles);
            }

            // If lazy loaded modules are defined - return LazyLoad wrapper
            const modules = options.modules || {};
            if (Object.keys(modules).length > 0) {
                return (
                    <LazyLoad modules={modules} options={{ props }}>
                        {modules => {
                            if (options.modulesProp) {
                                props[options.modulesProp] = modules;
                            } else {
                                _.assign(props, modules);
                            }
                            return createElement(props);
                        }}
                    </LazyLoad>
                );
            }

            return createElement(props);
        }
    }

    ComponentWrapper.displayName = name + "Wrapper";
    ComponentWrapper.__originalComponent = Component;
    ComponentWrapper.options = options;
    ComponentWrapper.defaultProps = _.assign({}, Component.defaultProps);

    return hoistNonReactStatics(ComponentWrapper, Component);
};
