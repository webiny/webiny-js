// @flow
import * as React from "react";
import _ from "lodash";
import { app } from "./../";

type Props = {
    modules: Array<mixed>,
    options: Object,
    onLoad: Function,
    children: Function,
    render?: Function
};

type State = {
    loaded: boolean,
    modules: Array<mixed> | null
};

class LazyLoad extends React.Component<Props, State> {
    static defaultProps: Object;
    mounted: boolean;

    constructor(props: Props) {
        super(props);

        this.mounted = false;

        this.state = {
            loaded: false,
            modules: null
        };
    }

    componentWillMount() {
        this.mounted = true;
        const { modules, options, onLoad } = this.props;
        app.modules.load(modules, options).then(modules => {
            // Finish loading and render content
            if (this.mounted) {
                this.setState({ loaded: true, modules });
                onLoad(modules);
            }
        });
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    render() {
        if (this.state.loaded) {
            try {
                return this.props.children(this.state.modules);
            } catch (e) {
                console.error(e);
            }
        }
        return null;
    }
}

LazyLoad.defaultProps = {
    modules: [],
    options: {},
    onLoad: _.noop
};

export default LazyLoad;
