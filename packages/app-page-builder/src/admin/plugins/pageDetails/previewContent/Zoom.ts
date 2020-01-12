import * as React from "react";
import store from "store";
import observe from "store/plugins/observe";
store.addPlugin(observe);

const LOCAL_STORAGE_KEY = "webiny_pb_page_zoom";

type ZoomProps = {
    children(params: { zoom: number; setZoom(zoom: number): void }): React.ReactElement;
};

type State = {
    zoom: number;
};

class Zoom extends React.Component<ZoomProps, State> {
    watchId: any;

    constructor(props) {
        super(props);

        this.state = {
            zoom: this.getZoomLevel()
        };
    }

    componentDidMount() {
        this.watchId = store.observe(LOCAL_STORAGE_KEY, async (zoom: string) => {
            this.setState({ zoom: parseFloat(zoom) });
        });
    }

    componentWillUnmount() {
        store.unobserve(this.watchId);
    }

    setZoomLevel = (zoom: number) => {
        store.set(LOCAL_STORAGE_KEY, zoom);
    };

    getZoomLevel = () => {
        const zoom = store.get(LOCAL_STORAGE_KEY);
        if (!zoom) {
            switch (true) {
                case window.innerWidth < 1600:
                    return 0.75;
                case window.innerWidth < 1200:
                    return 0.5;
                default:
                    return 1;
            }
        }

        return zoom;
    };

    render() {
        const { children } = this.props;
        return children({ zoom: this.state.zoom, setZoom: this.setZoomLevel });
    }
}

export default Zoom;
