import React from "react";
import { Elevation } from "@webiny/ui/Elevation";
// import { renderPlugins } from "@webiny/app/plugins";
import { css } from "emotion";
import { Tabs, Tab } from "@webiny/ui/Tabs";
import { Typography } from "@webiny/ui/Typography";
import ElementSettingsSideBar from "../../plugins/elementSettings/bar/ElementSettingsSideBar";
// Icons
import { ReactComponent as TouchIcon } from "../../assets/icons/touch_app.svg";

const rightSideBar = css({
    boxShadow: "1px 0px 5px 0px rgba(128,128,128,1)",
    position: "fixed",
    right: 0,
    top: 65,
    height: "100vh",
    width: 300,
    zIndex: 1
});

const noActiveElementWrapper = css({
    padding: 16,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    margin: "48px 16px",
    backgroundColor: "var(--mdc-theme-background)",
    color: "var(--mdc-theme-text-primary-on-background)",
    "& .icon": {
        fill: "var(--mdc-theme-text-icon-on-background)",
        width: 36,
        height: 36
    },
    "& .text": {
        marginTop: 16,
        color: "var(--mdc-theme-text-on-background)",
        textAlign: "center"
    }
});

const DefaultEditorSideBar = ({ shouldRenderSettings }) => {
    return (
        <Elevation z={1} className={rightSideBar}>
            <div>
                <Tabs>
                    <Tab label={"style"}>
                        {shouldRenderSettings ? (
                            <ElementSettingsSideBar tab={"style"} />
                        ) : (
                            <NoElementSelected />
                        )}
                    </Tab>
                    <Tab label={"Element"} disabled={!shouldRenderSettings}>
                        <ElementSettingsSideBar tab={"element"} />
                    </Tab>
                </Tabs>
            </div>
        </Elevation>
    );
};

export default React.memo(DefaultEditorSideBar);

const NoElementSelected = () => {
    return (
        <div className={noActiveElementWrapper}>
            <TouchIcon className={"icon"} />
            <Typography use={"subtitle1"} className={"text"}>
                Select an element on the canvas to activate this panel.
            </Typography>
        </div>
    );
};
