import React from "react";
import { Component } from "webiny-app";

export default Component({ modules: ["Icon", "SlateEditor"] })(
    ({ data, modules: { Icon, SlateEditor } }) => {
        return (
            <div>
                {data.icon && (
                    <div style={{ textAlign: "center" }}>
                        <Icon icon={data.icon.icon} size={data.iconSize} />
                    </div>
                )}
                <SlateEditor value={data.text} />
            </div>
        );
    }
);
