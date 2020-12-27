import { PbRenderResponsiveModePlugin } from "../../../types";
import { EditorMode } from "../../../editor/recoil/modules";

export default () => [
    {
        type: "pb-render-responsive-mode",
        name: "pb-render-responsive-mode-desktop",
        config: {
            name: EditorMode.desktop,
            maxWidth: 0,
            minWidth: 4000
        }
    } as PbRenderResponsiveModePlugin,
    {
        type: "pb-render-responsive-mode",
        name: "pb-render-responsive-mode-tablet",
        config: {
            name: EditorMode.tablet,
            maxWidth: 0,
            minWidth: 991
        }
    } as PbRenderResponsiveModePlugin,
    {
        type: "pb-render-responsive-mode",
        name: "pb-render-responsive-mode-mobile-landscape",
        config: {
            name: EditorMode.mobileLandscape,
            maxWidth: 0,
            minWidth: 767
        }
    } as PbRenderResponsiveModePlugin,
    {
        type: "pb-render-responsive-mode",
        name: "pb-render-responsive-mode-mobile-portrait",
        config: {
            name: EditorMode.mobilePortrait,
            maxWidth: 0,
            minWidth: 478
        }
    } as PbRenderResponsiveModePlugin
];
