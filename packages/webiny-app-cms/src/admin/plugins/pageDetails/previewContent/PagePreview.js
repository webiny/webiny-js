//@flow
import * as React from "react";
import { css } from "emotion";
import styled from "react-emotion";
import RenderElement from "webiny-app-cms/render/components/Element";
import { Typography } from "webiny-ui/src/Typography";
import { Select } from "webiny-ui/src/Select";

const pageInnerWrapper = css({
    overflowY: "scroll",
    overflowX: "hidden",
    height: "calc(100vh - 230px)",
    position: "relative",
    ".webiny-cms-page-document": {
        transform: "scale(var(--webiny-cms-page-preview-scale))"
    }
});

const PagePreviewToolbar = styled("div")({
    position: "sticky",
    bottom: 0,
    height: 30,
    paddingLeft: 15,
    color: "var(--mdc-theme-text-secondary-on-background)",
    borderTop: "1px solid var(--mdc-theme-on-background)",
    backgroundColor: "var(--mdc-theme-background)",
    width: "100%",
    transform: "translateZ(0)",
    display: "flex",
    overflow: "hidden",
    select: {
        fontSize: 14,
        color: "var(--mdc-theme-text-secondary-on-background)",
        width: 75
    }
});

type Props = {
    pageDetails: Object
};

type State = {
    zoom: number
};

class PagePreview extends React.Component<Props, State> {
    previewWrapperRef: Object;

    constructor(props: Object) {
        super(props);

        this.state = { zoom: this.getZoomLevel() };
        this.previewWrapperRef = React.createRef();
    }

    componentDidMount() {
        this.setZoomLevel(this.getZoomLevel());
    }

    getZoomLevel = () => {
        let zoom = 1;
        if (window.innerWidth < 1600) {
            zoom = 0.75;
        } else if (window.innerWidth < 1200) {
            zoom = 0.5;
        }

        return zoom;
    };

    setZoomLevel = (zoom: number) => {
        if (!this.previewWrapperRef.current) {
            return;
        }
        this.setState({ zoom });

        const el = this.previewWrapperRef.current;

        el.style.setProperty("--webiny-cms-page-preview-scale", zoom);
    };

    render() {
        const pageDetails = this.props.pageDetails;
        return (
            <div className={pageInnerWrapper} ref={this.previewWrapperRef}>
                <RenderElement element={pageDetails.page.content} />
                <PagePreviewToolbar>
                    <span>
                        <Typography use={"overline"}>Zoom:</Typography>
                    </span>
                    <Select value={this.state.zoom} onChange={zoom => this.setZoomLevel(zoom)}>
                        <option value={1}>100%</option>
                        <option value={0.75}>75%</option>
                        <option value={0.5}>50%</option>
                    </Select>
                </PagePreviewToolbar>
            </div>
        );
    }
}

export default PagePreview;
