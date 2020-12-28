import React from "react";
import { css } from "emotion";
import { PbEditorResponsiveModePlugin, DisplayMode } from "../../../types";
// Icons
import { ReactComponent as DesktopIcon } from "./icons/laptop_mac.svg";
import { ReactComponent as TabletIcon } from "./icons/tablet_mac.svg";
import { ReactComponent as MobileIcon } from "./icons/phone_iphone.svg";

const rotateStyle = css({
    transform: "rotate(90deg)"
});

export default () => [
    {
        type: "pb-editor-responsive-mode",
        name: "pb-editor-responsive-mode-desktop",
        config: {
            displayMode: DisplayMode.DESKTOP,
            label: "Desktop base breakpoint",
            icon: <DesktopIcon />
        }
    } as PbEditorResponsiveModePlugin,
    {
        type: "pb-editor-responsive-mode",
        name: "pb-editor-responsive-mode-tablet",
        config: {
            displayMode: DisplayMode.TABLET,
            label: "Tablet 991px and down",
            icon: <TabletIcon />
        }
    } as PbEditorResponsiveModePlugin,
    {
        type: "pb-editor-responsive-mode",
        name: "pb-editor-responsive-mode-mobile-landscape",
        config: {
            displayMode: DisplayMode.MOBILE_LANDSCAPE,
            label: "Mobile landscape 767px and down",
            icon: <MobileIcon className={rotateStyle} />
        }
    } as PbEditorResponsiveModePlugin,
    {
        type: "pb-editor-responsive-mode",
        name: "pb-editor-responsive-mode-mobile-portrait",
        config: {
            displayMode: DisplayMode.MOBILE_PORTRAIT,
            label: "Mobile portrait 478px and down",
            icon: <MobileIcon />
        }
    } as PbEditorResponsiveModePlugin
];
