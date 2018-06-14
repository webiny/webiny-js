import React from "react";
import { inject } from "webiny-client";

export default inject({ modules: ["Icon", "SlateEditor"] })(
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
