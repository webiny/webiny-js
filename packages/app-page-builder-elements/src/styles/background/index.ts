import { get } from "lodash";
import kebabCase from "lodash/kebabCase";
import applyPerDeviceStyleWithFallback from "~/utils/applyPerDeviceStyleWithFallback";

const scaling = {
    cover: {
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat"
    },
    contain: {
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat"
    },
    originalSize: {
        backgroundSize: "auto",
        backgroundRepeat: "no-repeat"
    },
    tile: {
        backgroundSize: "auto",
        backgroundRepeat: "repeat"
    },
    tileHorizontally: {
        backgroundSize: "auto",
        backgroundRepeat: "repeat-x"
    },
    tileVertically: {
        backgroundSize: "auto",
        backgroundRepeat: "repeat-y"
    }
};

export default ({ displayModes, element, style }) => {
    const { background } = get(element, "data.settings", {});

    applyPerDeviceStyleWithFallback({
        displayModes,
        applyStyle: ({ displayMode, fallbackMode }) => {
            // Set background color
            style[`--${kebabCase(displayMode)}-background-color`] = get(
                background,
                `${displayMode}.color`,
                get(style, `--${kebabCase(fallbackMode)}-background-color`, "transparent")
            );
            // Set background image properties

            const image = get(background, `${displayMode}.image`);
            const src = get(image, "file.src");
            if (src) {
                const scaleSettings = get(scaling, get(image, "scaling", "cover"), {});
                const position = get(image, "position", "center center");

                style[`--${kebabCase(displayMode)}-background-size`] = scaleSettings.backgroundSize;
                style[`--${kebabCase(displayMode)}-background-repeat`] =
                    scaleSettings.backgroundRepeat;
                style[`--${kebabCase(displayMode)}-background-image`] = src ? `url(${src})` : "";
                style[`--${kebabCase(displayMode)}-background-position`] = position;
            } else {
                style[`--${kebabCase(displayMode)}-background-size`] = get(
                    style,
                    `--${kebabCase(fallbackMode)}-background-size`,
                    "none"
                );
                style[`--${kebabCase(displayMode)}-background-repeat`] = get(
                    style,
                    `--${kebabCase(fallbackMode)}-background-repeat`,
                    "none"
                );
                style[`--${kebabCase(displayMode)}-background-image`] = get(
                    style,
                    `--${kebabCase(fallbackMode)}-background-image`,
                    "none"
                );
                style[`--${kebabCase(displayMode)}-background-position`] = get(
                    style,
                    `--${kebabCase(fallbackMode)}-background-position`,
                    "none"
                );
            }
        }
    });

    return style;
};
