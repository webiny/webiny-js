import { PbRenderResponsiveModePlugin, DisplayMode } from "../../../types";

export default () => [
    {
        type: "pb-render-responsive-mode",
        name: "pb-render-responsive-mode-desktop",
        config: {
            displayMode: DisplayMode.DESKTOP,
            maxWidth: 0,
            minWidth: 4000
        }
    } as PbRenderResponsiveModePlugin,
    {
        type: "pb-render-responsive-mode",
        name: "pb-render-responsive-mode-tablet",
        config: {
            displayMode: DisplayMode.TABLET,
            maxWidth: 0,
            minWidth: 991
        }
    } as PbRenderResponsiveModePlugin,
    {
        type: "pb-render-responsive-mode",
        name: "pb-render-responsive-mode-mobile-landscape",
        config: {
            displayMode: DisplayMode.MOBILE_LANDSCAPE,
            maxWidth: 0,
            minWidth: 767
        }
    } as PbRenderResponsiveModePlugin,
    {
        type: "pb-render-responsive-mode",
        name: "pb-render-responsive-mode-mobile-portrait",
        config: {
            displayMode: DisplayMode.MOBILE_PORTRAIT,
            maxWidth: 0,
            minWidth: 478
        }
    } as PbRenderResponsiveModePlugin
];
