import * as React from "react";
import store from "store";
import observe from "store/plugins/observe";
store.addPlugin(observe);

const LOCAL_STORAGE_KEY = "webiny_pb_page_zoom";

interface ZoomProps {
    children(params: { zoom: number; setZoom(zoom: number): void }): React.ReactElement;
}

interface ZoomState {
    zoom: number;
}

class Zoom extends React.Component<ZoomProps, ZoomState> {
    private watchId: any;

    constructor(props: ZoomProps) {
        super(props);

        this.state = {
            zoom: this.getZoomLevel()
        };
    }

    public override componentDidMount() {
        /**
         * Missing store.observe type.
         */
        // @ts-ignore
        this.watchId = store.observe(LOCAL_STORAGE_KEY, async (zoom: string) => {
            this.setState({ zoom: parseFloat(zoom) });
        });
    }

    public override componentWillUnmount() {
        /**
         * Missing store.unobserve type.
         */
        // @ts-ignore
        store.unobserve(this.watchId);
    }

    private readonly setZoomLevel = (zoom = 1): void => {
        store.set(LOCAL_STORAGE_KEY, zoom);
    };

    private readonly getZoomLevel = (): number => {
        const zoom = store.get(LOCAL_STORAGE_KEY) as number;
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

    public override render() {
        const { children } = this.props;
        return children({ zoom: this.state.zoom, setZoom: this.setZoomLevel });
    }
}

export default Zoom;
