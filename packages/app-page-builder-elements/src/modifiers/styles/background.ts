import { ElementStylesModifier } from "~/types";

interface Scaling {
    backgroundSize: string;
    backgroundRepeat: string;
}

interface ScalingMap {
    [key: string]: Scaling;
}

const SCALING_MAP: ScalingMap = {
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

const DEFAULT_SCALING = {
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat"
};

const DEFAULT_POSITION = "center center";

interface Values {
    color: string;
    image: {
        scaling: keyof ScalingMap;
        position: string;
        file: {
            src: string;
        };
    };
}

const background: ElementStylesModifier = ({ element, theme }) => {
    const { background } = element.data.settings || {};
    if (!background) {
        return null;
    }

    return Object.keys(theme.breakpoints || {}).reduce((returnStyles, breakpointName) => {
        const values = background[breakpointName] as unknown as Values | undefined;
        if (!values) {
            return returnStyles;
        }

        let backgroundColor = values.color;
        if (theme.styles.colors?.[backgroundColor]) {
            backgroundColor = theme.styles.colors?.[backgroundColor];
        }

        const styles = {
            backgroundColor
        };

        const { image } = values;
        if (image) {
            Object.assign(styles, SCALING_MAP[image.scaling] || DEFAULT_SCALING, {
                backgroundPosition: image.position || DEFAULT_POSITION
            });

            if (image.file) {
                Object.assign(styles, {
                    backgroundImage: `url("${image.file.src}")`
                });
            }
        }

        return { ...returnStyles, [breakpointName]: styles };
    }, {});
};

export const createBackground = () => background;
