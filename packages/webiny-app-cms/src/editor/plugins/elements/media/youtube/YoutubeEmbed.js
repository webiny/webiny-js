import * as React from "react";
import { css } from "emotion";
import { get } from "dot-prop-immutable";

const centerAlign = css({ width: "100%", textAlign: "center" });

const YoutubeEmbed = (props) => {
    const { element, data } = props;

    if (data && data.loading) {
        return "Loading Youtube data...";
    }

    return (
        <div
            id={"cms-embed-" + element.id}
            className={centerAlign}
            dangerouslySetInnerHTML={{ __html: get(element, "data.oembed.html") || "" }}
        />
    );
};

export default YoutubeEmbed;