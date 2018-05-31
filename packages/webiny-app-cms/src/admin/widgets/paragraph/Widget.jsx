import React from "react";
import { createComponent } from "webiny-app";
import SlateEditor from "./../slateEditor/Slate";

const Component = ({ onChange, data, modules: { Icon } }) => {
    return (
        <div>
            {data.icon && (
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                    <Icon icon={data.icon.icon} size={data.iconSize} />
                </div>
            )}
            <SlateEditor
                value={data.text}
                onChange={value => onChange({ ...data, text: value })}
            />
        </div>
    );
};

export default createComponent(Component, {modules: ["Icon"]});