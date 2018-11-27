//@flow
import * as React from "react";
import { css } from "emotion";
import { get } from "dot-prop-immutable";

const outerWrapper = css({
    boxSizing: "border-box"
});

const innerWrapper = css({
    left: 0,
    width: "100%",
    height: "auto",
    position: "relative",
    paddingBottom: 0
});

const scaleableVideo = css({
    position: "relative",
    height: 0,
    paddingTop: "56.25%",
    width: "100%",
    backgroundColor: "#000",
    ["iframe"]: {
        maxWidth: "100%",
        border: "none",
        display: "block",
        height: "100%",
        margin: 0,
        padding: 0,
        position: "absolute",
        top: 0,
        width: "100%"
    }
});

const YoutubeEmbed = (props: Object) => {
    const { element, data } = props;

    if (data && data.loading) {
        return "Loading Youtube data...";
    }

    return (
        <div className={outerWrapper}>
            <div className={innerWrapper}>
                <div
                    id={ element.id}
                    className={[
                        scaleableVideo,
                        "cms-editor-dragging--disabled",
                        "cms-editor-resizing--disabled"
                    ].join(" ")}
                    dangerouslySetInnerHTML={{ __html: get(element, "data.oembed.html") || "" }}
                />
            </div>
        </div>
    );
};

export default YoutubeEmbed;
