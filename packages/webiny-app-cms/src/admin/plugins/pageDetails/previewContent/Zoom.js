// @flow
import * as React from "react";
import store from "store";
import observe from "store/plugins/observe";
store.addPlugin(observe);

const LOCAL_STORAGE_KEY = "webiny_cms_page_zoom";

type State = {
    zoom: number
};

class Zoom extends React.Component<*, State> {
    constructor() {
        super();

        this.state = {
            zoom: this.getZoomLevel()
        };
    }

    componentDidMount() {
        store.observe(LOCAL_STORAGE_KEY, async (zoom: string) => {
            this.setState({ zoom: parseFloat(zoom) });
        });
    }

    setZoomLevel = (zoom: number) => {
        store.set(LOCAL_STORAGE_KEY, zoom);
    };

    getZoomLevel = () => {
        let zoom = store.get(LOCAL_STORAGE_KEY);
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
        return this.props.children({ zoom: this.state.zoom, setZoom: this.setZoomLevel });
    }
}

export default Zoom;
