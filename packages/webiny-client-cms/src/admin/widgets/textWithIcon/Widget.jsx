import React from "react";
import { inject } from "webiny-client";

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

export default inject({ modules: ["Icon", "SlateEditor"] })(Widget);
