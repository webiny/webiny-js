import { get } from "lodash";
import kebabCase from "lodash/kebabCase";
import { plugins } from "@webiny/plugins";
import { PbRenderResponsiveModePlugin, PbRenderElementStylePlugin } from "../../../../types";

export default [
    {
        name: "pb-render-page-element-style-horizontal-align",
        type: "pb-render-page-element-style",
        renderStyle({ element, style }) {
            const { horizontalAlign } = get(element, "data.settings", {});
            if (!horizontalAlign) {
                return style;
            }
            return { ...style, textAlign: horizontalAlign };
        }
    },
    {
        name: "pb-render-page-element-style-horizontal-align-flex",
        type: "pb-render-page-element-style",
        renderStyle({ element, style }) {
            const { horizontalAlignFlex } = get(element, "data.settings", {});
            if (!horizontalAlignFlex) {
                return style;
            }

            // Get editor modes
            const editorModes = plugins
                .byType<PbRenderResponsiveModePlugin>("pb-render-responsive-mode")
                .map(pl => pl.config);

            // Set per-device property value
            editorModes.forEach(({ name: deviceName }) => {
                style[`--${kebabCase(deviceName)}-justify-content`] = get(
                    horizontalAlignFlex,
                    deviceName
                );
            });

            return style;
        }
    },
    {
        name: "pb-render-page-element-style-vertical-align",
        type: "pb-render-page-element-style",
        renderStyle({ element, style }) {
            const { verticalAlign } = get(element, "data.settings", {});
            if (!verticalAlign) {
                return style;
            }

            // Get editor modes
            const editorModes = plugins
                .byType<PbRenderResponsiveModePlugin>("pb-render-responsive-mode")
                .map(pl => pl.config);

            // Set per-device property value
            editorModes.forEach(({ name: deviceName }) => {
                style[`--${kebabCase(deviceName)}-align-items`] = get(verticalAlign, deviceName);
            });

            return style;
        }
    }
] as PbRenderElementStylePlugin[];
