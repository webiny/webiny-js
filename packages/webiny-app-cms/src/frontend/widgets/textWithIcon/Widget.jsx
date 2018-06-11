import React from "react";
import { Component } from "webiny-app";

export default Component({ modules: ["Icon", "SlateEditor"] })(
    ({ widget: { data }, modules: { Icon, SlateEditor } }) => {
        return (
            <div>
                {data.icon && (
                    <div style={{ textAlign: "center", marginBottom: 20 }}>
                        <Icon icon={data.icon.icon} size={data.iconSize} />
                    </div>
                )}
                <SlateEditor value={data.text} />
            </div>
        );
    }
);
