import React from "react";
import { css } from "emotion";
import { PbEditorResponsiveModePlugin } from "../../../types";
import { EditorMode } from "../../recoil/modules";
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
            name: EditorMode.desktop,
            label: "Desktop base breakpoint",
            icon: <DesktopIcon />
        }
    } as PbEditorResponsiveModePlugin,
    {
        type: "pb-editor-responsive-mode",
        name: "pb-editor-responsive-mode-tablet",
        config: {
            name: EditorMode.tablet,
            label: "Tablet 991px and down",
            icon: <TabletIcon />
        }
    } as PbEditorResponsiveModePlugin,
    {
        type: "pb-editor-responsive-mode",
        name: "pb-editor-responsive-mode-mobile-landscape",
        config: {
            name: EditorMode.mobileLandscape,
            label: "Mobile landscape 767px and down",
            icon: <MobileIcon className={rotateStyle} />
        }
    } as PbEditorResponsiveModePlugin,
    {
        type: "pb-editor-responsive-mode",
        name: "pb-editor-responsive-mode-mobile-portrait",
        config: {
            name: EditorMode.mobilePortrait,
            label: "Mobile portrait 478px and down",
            icon: <MobileIcon />
        }
    } as PbEditorResponsiveModePlugin
];
