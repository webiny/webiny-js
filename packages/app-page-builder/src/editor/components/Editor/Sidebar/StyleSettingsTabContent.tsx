import React, { useMemo } from "react";
import styled from "@emotion/styled";
import useElementSettings from "../../../plugins/elementSettings/bar/useElementSettings";
import NoActiveElement from "./NoActiveElement";
import { ReactComponent as TouchIcon } from "./icons/touch_app.svg";
import { ReactComponent as WarningIcon } from "./icons/warning-black.svg";

const RootElement = styled("div")({
    height: "calc(100vh - 65px - 48px)", // Subtract top-bar and tab-header height
    overflowY: "auto",
    // Style scrollbar
    "&::-webkit-scrollbar": {
        width: 1
    },
    "&::-webkit-scrollbar-track": {
        boxShadow: "inset 0 0 6px rgba(0, 0, 0, 0.3)"
    },
    "&::-webkit-scrollbar-thumb": {
        backgroundColor: "darkgrey",
        outline: "1px solid slategrey"
    }
});

const StyleSettingsTabContent = ({ element }) => {
    const elementSettings = useElementSettings();
    const styleSettings = useMemo(() => {
        return elementSettings.filter(({ plugin }) => Boolean(typeof plugin.render === "function"));
    }, [elementSettings]);

    if (!element) {
        return (
            <NoActiveElement
                icon={<TouchIcon />}
                message={"Select an element on the canvas to activate this panel."}
            />
        );
    }

    return (
        <RootElement>
            {styleSettings.length ? (
                styleSettings.map(({ plugin, options }, index) => {
                    return (
                        <React.Fragment key={index}>
                            {typeof plugin.render === "function" && plugin.render({ options })}
                        </React.Fragment>
                    );
                })
            ) : (
                <NoActiveElement
                    icon={<WarningIcon />}
                    message={"No style settings found for selected element."}
                />
            )}
        </RootElement>
    );
};

export default React.memo(StyleSettingsTabContent);
