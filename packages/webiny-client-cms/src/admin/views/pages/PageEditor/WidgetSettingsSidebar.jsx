import React from "react";
import { inject } from "webiny-client";
import WidgetSettings from "./WidgetSettings";

export default inject({ modules: ["Icon"] })(props => {
    const {
        className,
        height = "100vh",
        widget,
        onClose,
        onChange,
        animationTarget,
        modules: { Icon }
    } = props;

    const style = {
        height,
        overflow: "scroll"
    };
    
    return (
        <div style={style} className={className} ref={animationTarget}>
            <span
                onClick={onClose}
                style={{
                    position: "absolute",
                    cursor: "pointer",
                    right: 15,
                    top: 18
                }}
            >
                {widget && `(${widget.type})`}
                {"  "}
                <Icon icon={"times"} size={"lg"} />
            </span>
            {widget && <WidgetSettings onClose={onClose} onChange={onChange} widget={widget} />}
        </div>
    );
});
