import React from "react";
import { Component } from "webiny-client";

const Widget = ({ widget: { data }, Bind, modules: { Icon, SlateEditor } }) => {
    return (
        <div>
            {data.icon && (
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                    <Icon icon={data.icon.icon} size={data.iconSize} />
                </div>
            )}
            <Bind name="text">
                <SlateEditor />
            </Bind>
        </div>
    );
};

export default Component({ modules: ["Icon", "SlateEditor"] })(Widget);
