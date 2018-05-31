import React from "react";
import { createComponent } from "webiny-app";
import Widget from "../../utils/Widget";

let Component = ({ data, modules: { Icon } }) => {
    return (
        <div>
            {data.icon && (
                <div style={{ textAlign: "center" }}>
                    <Icon icon={data.icon.icon} size={data.iconSize} />
                </div>
            )}
            <p style={{ marginTop: 30, textAlign: data.align || "left" }}>{data.text}</p>
        </div>
    );
};

Component = createComponent(Component, { modules: ["Icon"] });

class ParagraphWidget extends Widget {
    render({ widget }) {
        return <Component data={widget.data} />;
    }
}

export default ParagraphWidget;
