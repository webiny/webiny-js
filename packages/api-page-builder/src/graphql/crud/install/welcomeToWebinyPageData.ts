import { File } from "@webiny/api-file-manager/types";
import get from "lodash/get";

const FILE_ID_MAP = {
    HERO_BLOCK_BG_SVG: "6022814b7a77e60008f70d62",
    WEBINY_LOGO_SVG: "6022814b0df4b000088735bc",
    FEATURE_CARD_BG_SVG: "602282e07a77e60008f70d63",
    WEBINY_SERVERLESS_APPLICATION_FRAMEWORK_SVG: "6022814a0df4b000088735bb",
    WEBINY_INFRASTRUCTURE_OVERVIEW_SVG: "6022814891bd1300087bd24c",
    PINK_SHAPE_SVG: "60228148f98841000981c723",
    SECURITY_SVG: "6022814bef4a940008b3ba27",
    SCAFFOLDING_SVG: "6022814bef4a940008b3ba26",
    IDP_SVG: "60228148f98841000981c724",
    ENVIRONMENTS_SVG: "6022814bef4a940008b3ba28",
    WEBINY_SERVERLESS_CMS_SVG: "602281486ed41f0008bc2dad",
    SERVERLESS_CMS_LOGO_SVG: "602281486639200009fd35eb",
    CMS_BENEFITS_SHAPE_SVG: "602281486639200009fd35ec",
    SCALABLE_ICON_SVG: "60228148fa244d0008c47c79",
    ADAPTABLE_ICON_SVG: "60228145f98841000981c720",
    COST_ICON_SVG: "6022814851197600081724ae",
    DATA_ICON_SVG: "602281486ed41f0008bc2dac",
    PERMISSION_ICON_SVG: "602281486ed41f0008bc2dab",
    DEVELOPER_SVG: "60228145f98841000981c721",
    OCTO_CAT_SVG: "60228145f98841000981c71f",
    COMMUNITY_ICON_SVG: "60228148fa244d0008c47c7a"
};

interface PreparePageDataParams {
    srcPrefix: string;
    fileIdToFileMap: Record<string, File>;
}

/**
 * Too complex to handle atm.
 */
// TODO @ts-refactor figure type for the content
export const preparePageData = ({
    srcPrefix,
    fileIdToFileMap
}: PreparePageDataParams): Record<string, any> => {
    /**
     * By default the "srcPrefix" always ends with forward slash.
     * But, string concatenation looks ugly without forward slash,
     * so, we're intentionally removing the trailing forward slash from it.
     */
    if (srcPrefix && srcPrefix.endsWith("/")) {
        srcPrefix = srcPrefix.slice(0, -1);
    }

    return {
        id: "Fv1PpPWu-",
        type: "document",
        data: { settings: {} },
        elements: [
            {
                id: "xqt7BI4iN9",
                type: "block",
                data: {
                    settings: {
                        width: { desktop: { value: "100%" } },
                        margin: {
                            desktop: {
                                top: "0px",
                                right: "0px",
                                bottom: "0px",
                                left: "0px",
                                advanced: true
                            }
                        },
                        padding: {
                            desktop: {
                                all: "10px",
                                advanced: true,
                                top: "100px",
                                bottom: "275px",
                                left: "16px",
                                right: "16px"
                            },
                            tablet: { advanced: true, left: "10px", right: "10px" }
                        },
                        horizontalAlignFlex: { desktop: "center" },
                        verticalAlign: { desktop: "flex-start" },
                        background: {
                            desktop: {
                                image: {
                                    file: {
                                        id: "6022814b7a77e60008f70d62",
                                        src: `${srcPrefix}/${get(
                                            fileIdToFileMap,
                                            `${FILE_ID_MAP.HERO_BLOCK_BG_SVG}.key`
                                        )}`
                                    }
                                }
                            }
                        }
                    }
                },
                elements: [
                    {
                        id: "gdE7Q7rcA",
                        type: "grid",
                        data: {
                            settings: {
                                width: { desktop: { value: "1100px" } },
                                margin: {
                                    desktop: {
                                        top: "0px",
                                        right: "0px",
                                        bottom: "20px",
                                        left: "0px",
                                        advanced: true
                                    }
                                },
                                padding: {
                                    desktop: {
                                        all: "0px",
                                        top: "0px",
                                        right: "0px",
                                        bottom: "0px",
                                        left: "0px"
                                    }
                                },
                                grid: { cellsType: "12" },
                                gridSettings: {
                                    desktop: {
                                        flexDirection: "row"
                                    },
                                    "mobile-landscape": {
                                        flexDirection: "column"
                                    }
                                },
                                horizontalAlignFlex: { desktop: "flex-start" },
                                verticalAlign: { desktop: "flex-start" }
                            }
                        },
                        elements: [
                            {
                                id: "_fbQO4Nlpp",
                                type: "cell",
                                data: {
                                    settings: {
                                        margin: {
                                            desktop: {
                                                top: "0px",
                                                right: "0px",
                                                bottom: "0px",
                                                left: "0px",
                                                advanced: true
                                            }
                                        },
                                        padding: { desktop: { all: "0px" } },
                                        grid: { size: 12 }
                                    }
                                },
                                elements: [
                                    {
                                        id: "cdk_pclqE",
                                        type: "image",
                                        data: {
                                            settings: {
                                                horizontalAlignFlex: { desktop: "center" },
                                                margin: { desktop: { all: "0px" } },
                                                padding: { desktop: { all: "0px" } }
                                            },
                                            image: {
                                                file: {
                                                    id: "6022814b0df4b000088735bc",
                                                    src: `${srcPrefix}/${get(
                                                        fileIdToFileMap,
                                                        `${FILE_ID_MAP.WEBINY_LOGO_SVG}.key`
                                                    )}`
                                                },
                                                height: "44px"
                                            }
                                        },
                                        elements: []
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        id: "ovLRNqyVu3",
                        type: "grid",
                        data: {
                            settings: {
                                width: { desktop: { value: "1100px" } },
                                margin: {
                                    desktop: {
                                        top: "0px",
                                        right: "0px",
                                        bottom: "0px",
                                        left: "0px",
                                        advanced: true
                                    }
                                },
                                padding: {
                                    desktop: {
                                        all: "0px",
                                        top: "0px",
                                        right: "0px",
                                        bottom: "0px",
                                        left: "0px"
                                    }
                                },
                                grid: { cellsType: "12" },
                                gridSettings: {
                                    desktop: {
                                        flexDirection: "row"
                                    },
                                    "mobile-landscape": {
                                        flexDirection: "column"
                                    }
                                },
                                horizontalAlignFlex: { desktop: "flex-start" },
                                verticalAlign: { desktop: "flex-start" }
                            }
                        },
                        elements: [
                            {
                                id: "wmMU13uZ10",
                                type: "cell",
                                data: {
                                    settings: {
                                        margin: {
                                            desktop: {
                                                top: "0px",
                                                right: "0px",
                                                bottom: "0px",
                                                left: "0px",
                                                advanced: true
                                            }
                                        },
                                        padding: { desktop: { all: "0px" } },
                                        grid: { size: 12 }
                                    }
                                },
                                elements: [
                                    {
                                        id: "1eUZzAvoB",
                                        type: "heading",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "heading",
                                                    typography: "heading1",
                                                    alignment: "center",
                                                    tag: "h1",
                                                    color: "color6"
                                                },
                                                data: { text: "<b>Welcome to Webiny</b>" }
                                            },
                                            settings: {
                                                margin: { desktop: { all: "0px" } },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        id: "F6ZREnQcc",
                        type: "grid",
                        data: {
                            settings: {
                                width: { desktop: { value: "1100px" } },
                                margin: {
                                    desktop: {
                                        top: "64px",
                                        right: "0px",
                                        bottom: "0px",
                                        left: "0px",
                                        advanced: true
                                    }
                                },
                                padding: {
                                    desktop: {
                                        all: "0px",
                                        top: "0px",
                                        right: "0px",
                                        bottom: "0px",
                                        left: "0px"
                                    }
                                },
                                grid: { cellsType: "12" },
                                gridSettings: {
                                    desktop: {
                                        flexDirection: "row"
                                    },
                                    "mobile-landscape": {
                                        flexDirection: "column"
                                    }
                                },
                                horizontalAlignFlex: { desktop: "flex-start" },
                                verticalAlign: { desktop: "flex-start" }
                            }
                        },
                        elements: [
                            {
                                id: "oEgjDLVXUu",
                                type: "cell",
                                data: {
                                    settings: {
                                        margin: {
                                            desktop: {
                                                top: "0px",
                                                right: "0px",
                                                bottom: "0px",
                                                left: "0px",
                                                advanced: true
                                            }
                                        },
                                        padding: { desktop: { all: "0px" } },
                                        grid: { size: 12 }
                                    }
                                },
                                elements: [
                                    {
                                        id: "0xYOozhJw",
                                        type: "paragraph",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "paragraph",
                                                    typography: "paragraph1",
                                                    alignment: "center",
                                                    tag: "div",
                                                    color: "color6"
                                                },
                                                data: {
                                                    text: "Webiny makes it easy to build applications and websites on top of the serverless infrastructure by providing you with a ready-made CMS and a development framework.<br>"
                                                }
                                            },
                                            settings: {
                                                margin: { desktop: { all: "0px" } },
                                                padding: {
                                                    desktop: {
                                                        all: "0px",
                                                        advanced: true,
                                                        left: "20%",
                                                        right: "20%"
                                                    },
                                                    tablet: {
                                                        left: "0px",
                                                        right: "0px",
                                                        advanced: true
                                                    }
                                                }
                                            }
                                        },
                                        elements: []
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        id: "gwhTOrZvc",
                        type: "grid",
                        data: {
                            settings: {
                                width: { desktop: { value: "1100px" } },
                                margin: {
                                    desktop: {
                                        top: "30px",
                                        right: "0px",
                                        bottom: "0px",
                                        left: "0px",
                                        advanced: true
                                    }
                                },
                                padding: {
                                    desktop: {
                                        all: "0px",
                                        top: "0px",
                                        right: "0px",
                                        bottom: "0px",
                                        left: "0px"
                                    }
                                },
                                grid: { cellsType: "6-6" },
                                gridSettings: {
                                    desktop: {
                                        flexDirection: "row"
                                    },
                                    "mobile-landscape": {
                                        flexDirection: "column"
                                    }
                                },
                                horizontalAlignFlex: { desktop: "flex-start" },
                                verticalAlign: { desktop: "flex-start" }
                            }
                        },
                        elements: [
                            {
                                id: "EaIMtHtOIw",
                                type: "cell",
                                data: {
                                    settings: {
                                        margin: {
                                            desktop: {
                                                top: "0px",
                                                right: "0px",
                                                bottom: "0px",
                                                left: "-8px",
                                                advanced: true
                                            },
                                            "mobile-landscape": {
                                                advanced: true,
                                                left: "0px",
                                                bottom: "16px"
                                            },
                                            tablet: { left: "px" }
                                        },
                                        padding: { desktop: { all: "0px" } },
                                        grid: { size: 6 },
                                        background: {
                                            desktop: {
                                                image: {
                                                    file: {
                                                        id: "602282e07a77e60008f70d63",
                                                        src: `${srcPrefix}/${get(
                                                            fileIdToFileMap,
                                                            `${FILE_ID_MAP.FEATURE_CARD_BG_SVG}.key`
                                                        )}`
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                elements: [
                                    {
                                        id: "8k7zxQUTm",
                                        type: "heading",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "heading",
                                                    typography: "heading6",
                                                    alignment: "center",
                                                    tag: "h6",
                                                    color: "color6"
                                                },
                                                data: { text: "Scalable" }
                                            },
                                            settings: {
                                                margin: { desktop: { all: "0px" } },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    },
                                    {
                                        id: "qNngQ1C-5",
                                        type: "paragraph",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "paragraph",
                                                    typography: "paragraph2",
                                                    alignment: "center",
                                                    tag: "div",
                                                    color: "color6"
                                                },
                                                data: {
                                                    text: "Webiny apps can scale to handle the most demanding workloads.<br>"
                                                }
                                            },
                                            settings: {
                                                margin: { desktop: { all: "0px" } },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    }
                                ]
                            },
                            {
                                id: "uBv_VRv0i",
                                type: "cell",
                                data: {
                                    settings: {
                                        margin: {
                                            desktop: {
                                                top: "0px",
                                                right: "0px",
                                                bottom: "0px",
                                                left: "8px",
                                                advanced: true
                                            },
                                            "mobile-landscape": { advanced: true, left: "0px" }
                                        },
                                        padding: { desktop: { all: "0px" } },
                                        grid: { size: 6 },
                                        background: {
                                            desktop: {
                                                image: {
                                                    file: {
                                                        id: "602282e07a77e60008f70d63",
                                                        src: `${srcPrefix}/${get(
                                                            fileIdToFileMap,
                                                            `${FILE_ID_MAP.FEATURE_CARD_BG_SVG}.key`
                                                        )}`
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                elements: [
                                    {
                                        id: "iQaW4vjKg",
                                        type: "heading",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "heading",
                                                    typography: "heading6",
                                                    alignment: "center",
                                                    tag: "h6",
                                                    color: "color6"
                                                },
                                                data: { text: "No custom tooling required" }
                                            },
                                            settings: {
                                                margin: { desktop: { all: "0px" } },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    },
                                    {
                                        id: "Wy3Tw-Lb8",
                                        type: "paragraph",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "paragraph",
                                                    typography: "paragraph2",
                                                    alignment: "center",
                                                    tag: "div",
                                                    color: "color6"
                                                },
                                                data: {
                                                    text: "Webiny eliminates the need to build custom tooling to create serverless app<br>"
                                                }
                                            },
                                            settings: {
                                                margin: { desktop: { all: "0px" } },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        id: "uwrjoSZkB",
                        type: "grid",
                        data: {
                            settings: {
                                width: { desktop: { value: "1100px" } },
                                margin: {
                                    desktop: {
                                        top: "30px",
                                        right: "0px",
                                        bottom: "0px",
                                        left: "0px",
                                        advanced: true
                                    },
                                    "mobile-landscape": { advanced: false }
                                },
                                padding: {
                                    desktop: {
                                        all: "0px",
                                        top: "0px",
                                        right: "0px",
                                        bottom: "0px",
                                        left: "0px"
                                    }
                                },
                                grid: { cellsType: "6-6" },
                                gridSettings: {
                                    desktop: {
                                        flexDirection: "row"
                                    },
                                    "mobile-landscape": {
                                        flexDirection: "column"
                                    }
                                },
                                horizontalAlignFlex: { desktop: "flex-start" },
                                verticalAlign: { desktop: "flex-start" }
                            }
                        },
                        elements: [
                            {
                                id: "Q39eQZm_8z",
                                type: "cell",
                                data: {
                                    settings: {
                                        margin: {
                                            desktop: {
                                                top: "0px",
                                                right: "0px",
                                                bottom: "0px",
                                                left: "-8px",
                                                advanced: true
                                            },
                                            "mobile-landscape": {
                                                advanced: true,
                                                left: "0px",
                                                bottom: "16px"
                                            }
                                        },
                                        padding: { desktop: { all: "0px" } },
                                        grid: { size: 6 },
                                        background: {
                                            desktop: {
                                                image: {
                                                    file: {
                                                        id: "602282e07a77e60008f70d63",
                                                        src: `${srcPrefix}/${get(
                                                            fileIdToFileMap,
                                                            `${FILE_ID_MAP.FEATURE_CARD_BG_SVG}.key`
                                                        )}`
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                elements: [
                                    {
                                        id: "zSVZIwnSQ0",
                                        type: "heading",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "heading",
                                                    typography: "heading6",
                                                    alignment: "center",
                                                    tag: "h6",
                                                    color: "color6"
                                                },
                                                data: { text: "Cost effective" }
                                            },
                                            settings: {
                                                margin: { desktop: { all: "0px" } },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    },
                                    {
                                        id: "S-Ydr4kX6k",
                                        type: "paragraph",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "paragraph",
                                                    typography: "paragraph2",
                                                    alignment: "center",
                                                    tag: "div",
                                                    color: "color6"
                                                },
                                                data: {
                                                    text: "Webiny apps run on serverless infrastructure which costs 80% less than VMs<br>"
                                                }
                                            },
                                            settings: {
                                                margin: { desktop: { all: "0px" } },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    }
                                ]
                            },
                            {
                                id: "nUX2JXYjhD",
                                type: "cell",
                                data: {
                                    settings: {
                                        margin: {
                                            desktop: {
                                                top: "0px",
                                                right: "0px",
                                                bottom: "0px",
                                                left: "8px",
                                                advanced: true
                                            },
                                            tablet: { advanced: true, left: "8px", top: "0px" },
                                            "mobile-landscape": { advanced: true, left: "0px" }
                                        },
                                        padding: { desktop: { all: "0px" } },
                                        grid: { size: 6 },
                                        background: {
                                            desktop: {
                                                image: {
                                                    file: {
                                                        id: "602282e07a77e60008f70d63",
                                                        src: `${srcPrefix}/${get(
                                                            fileIdToFileMap,
                                                            `${FILE_ID_MAP.FEATURE_CARD_BG_SVG}.key`
                                                        )}`
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                elements: [
                                    {
                                        id: "8z0hL8l7ay",
                                        type: "heading",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "heading",
                                                    typography: "heading6",
                                                    alignment: "center",
                                                    tag: "h6",
                                                    color: "color6"
                                                },
                                                data: { text: "Resolves serverless challenges" }
                                            },
                                            settings: {
                                                margin: { desktop: { all: "0px" } },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    },
                                    {
                                        id: "04ZNIcAGE_",
                                        type: "paragraph",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "paragraph",
                                                    typography: "paragraph2",
                                                    alignment: "center",
                                                    tag: "div",
                                                    color: "color6"
                                                },
                                                data: {
                                                    text: "Webiny removes all the challenges of building serverless applications<br>"
                                                }
                                            },
                                            settings: {
                                                margin: { desktop: { all: "0px" } },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                id: "vm0cFfH8KG",
                type: "block",
                data: {
                    settings: {
                        width: { desktop: { value: "100%" } },
                        margin: {
                            desktop: {
                                top: "0px",
                                right: "0px",
                                bottom: "0px",
                                left: "0px",
                                advanced: true
                            }
                        },
                        padding: {
                            desktop: {
                                all: "10px",
                                advanced: true,
                                top: "65px",
                                bottom: "75px",
                                left: "16px",
                                right: "16px"
                            }
                        },
                        horizontalAlignFlex: { desktop: "center" },
                        verticalAlign: { desktop: "flex-start" }
                    }
                },
                elements: [
                    {
                        id: "txeqybzKr3",
                        type: "grid",
                        data: {
                            settings: {
                                width: { desktop: { value: "1100px" } },
                                margin: {
                                    desktop: {
                                        top: "0px",
                                        right: "0px",
                                        bottom: "80px",
                                        left: "0px",
                                        advanced: true
                                    }
                                },
                                padding: {
                                    desktop: {
                                        all: "0px",
                                        top: "0px",
                                        right: "0px",
                                        bottom: "0px",
                                        left: "0px"
                                    }
                                },
                                grid: { cellsType: "12" },
                                gridSettings: {
                                    desktop: {
                                        flexDirection: "row"
                                    },
                                    "mobile-landscape": {
                                        flexDirection: "column"
                                    }
                                },
                                horizontalAlignFlex: { desktop: "flex-start" },
                                verticalAlign: { desktop: "flex-start" }
                            }
                        },
                        elements: [
                            {
                                id: "wMjC2uv8cj",
                                type: "cell",
                                data: {
                                    settings: {
                                        margin: {
                                            desktop: {
                                                top: "0px",
                                                right: "0px",
                                                bottom: "0px",
                                                left: "0px",
                                                advanced: true
                                            }
                                        },
                                        padding: { desktop: { all: "0px" } },
                                        grid: { size: 12 }
                                    }
                                },
                                elements: [
                                    {
                                        id: "Pm7ws20iA",
                                        type: "heading",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "heading",
                                                    typography: "heading1",
                                                    alignment: "center",
                                                    tag: "h1",
                                                    color: "color3"
                                                },
                                                data: { text: "<b>Get to know Webiny products</b>" }
                                            },
                                            settings: {
                                                margin: { desktop: { all: "0px" } },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    },
                                    {
                                        id: "6CPpd558B",
                                        type: "heading",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "heading",
                                                    typography: "heading2",
                                                    alignment: "center",
                                                    tag: "h2",
                                                    color: "color3"
                                                },
                                                data: { text: "Architect. Code. Deploy." }
                                            },
                                            settings: {
                                                margin: {
                                                    desktop: {
                                                        all: "0px",
                                                        advanced: true,
                                                        top: "16px"
                                                    }
                                                },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        id: "1e0_OJgMx",
                        type: "grid",
                        data: {
                            settings: {
                                width: { desktop: { value: "1100px" } },
                                margin: {
                                    desktop: {
                                        top: "0px",
                                        right: "0px",
                                        bottom: "0px",
                                        left: "0px",
                                        advanced: true
                                    }
                                },
                                padding: {
                                    desktop: {
                                        all: "0px",
                                        top: "0px",
                                        right: "0px",
                                        bottom: "0px",
                                        left: "0px"
                                    }
                                },
                                grid: { cellsType: "6-6" },
                                gridSettings: {
                                    desktop: {
                                        flexDirection: "row"
                                    },
                                    "mobile-landscape": {
                                        flexDirection: "column"
                                    }
                                },
                                horizontalAlignFlex: { desktop: "flex-start" },
                                verticalAlign: { desktop: "flex-start" }
                            }
                        },
                        elements: [
                            {
                                id: "gpYd80MXeg",
                                type: "cell",
                                data: {
                                    settings: {
                                        margin: {
                                            desktop: {
                                                top: "0px",
                                                right: "0px",
                                                bottom: "0px",
                                                left: "0px",
                                                advanced: true
                                            },
                                            "mobile-landscape": { advanced: true, bottom: "40px" }
                                        },
                                        padding: {
                                            desktop: { all: "0px", advanced: true, right: "15px" },
                                            "mobile-landscape": { advanced: true, right: "0px" }
                                        },
                                        grid: { size: 6 }
                                    }
                                },
                                elements: [
                                    {
                                        id: "kAYc-QClR",
                                        type: "grid",
                                        data: {
                                            settings: {
                                                width: { desktop: { value: "1100px" } },
                                                margin: {
                                                    desktop: {
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px",
                                                        advanced: true
                                                    }
                                                },
                                                padding: {
                                                    desktop: {
                                                        all: "0px",
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "30px",
                                                        left: "0px",
                                                        advanced: true
                                                    }
                                                },
                                                grid: { cellsType: "4-8" },
                                                gridSettings: {
                                                    desktop: {
                                                        flexDirection: "row"
                                                    },
                                                    "mobile-landscape": {
                                                        flexDirection: "column"
                                                    }
                                                },
                                                horizontalAlignFlex: { desktop: "flex-start" },
                                                verticalAlign: { desktop: "center" },
                                                border: {
                                                    desktop: {
                                                        style: "solid",
                                                        color: "rgba(229, 229, 229, 1)",
                                                        width: {
                                                            all: "1",
                                                            advanced: true,
                                                            bottom: "1"
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        elements: [
                                            {
                                                id: "8i803wClVt",
                                                type: "cell",
                                                data: {
                                                    settings: {
                                                        margin: {
                                                            desktop: {
                                                                top: "0px",
                                                                right: "0px",
                                                                bottom: "0px",
                                                                left: "0px",
                                                                advanced: true
                                                            }
                                                        },
                                                        padding: { desktop: { all: "0px" } },
                                                        grid: { size: 3 }
                                                    }
                                                },
                                                elements: [
                                                    {
                                                        id: "p55J-BkDn",
                                                        type: "image",
                                                        data: {
                                                            settings: {
                                                                horizontalAlignFlex: {
                                                                    desktop: "center"
                                                                },
                                                                margin: { desktop: { all: "0px" } },
                                                                padding: { desktop: { all: "0px" } }
                                                            },
                                                            image: {
                                                                file: {
                                                                    id: "6022814a0df4b000088735bb",
                                                                    src: `${srcPrefix}/${get(
                                                                        fileIdToFileMap,
                                                                        `${FILE_ID_MAP.WEBINY_SERVERLESS_APPLICATION_FRAMEWORK_SVG}.key`
                                                                    )}`
                                                                },
                                                                height: "90px"
                                                            },
                                                            link: {}
                                                        },
                                                        elements: []
                                                    }
                                                ]
                                            },
                                            {
                                                id: "8nddxG64r",
                                                type: "cell",
                                                data: {
                                                    settings: {
                                                        margin: {
                                                            desktop: {
                                                                top: "0px",
                                                                right: "0px",
                                                                bottom: "0px",
                                                                left: "0px",
                                                                advanced: true
                                                            }
                                                        },
                                                        padding: { desktop: { all: "0px" } },
                                                        grid: { size: 9 }
                                                    }
                                                },
                                                elements: [
                                                    {
                                                        id: "PR-yiR65n",
                                                        type: "heading",
                                                        data: {
                                                            text: {
                                                                desktop: {
                                                                    type: "heading",
                                                                    typography: "heading3",
                                                                    alignment: "left",
                                                                    tag: "h3",
                                                                    color: "color3"
                                                                },
                                                                data: {
                                                                    text: "Webiny Serverless </p><p>Application Framework"
                                                                }
                                                            },
                                                            settings: {
                                                                margin: { desktop: { all: "0px" } },
                                                                padding: {
                                                                    desktop: { all: "0px" }
                                                                }
                                                            }
                                                        },
                                                        elements: []
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        id: "pVH9_fFLM",
                                        type: "grid",
                                        data: {
                                            settings: {
                                                width: { desktop: { value: "1100px" } },
                                                margin: {
                                                    desktop: {
                                                        top: "30px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px",
                                                        advanced: true
                                                    }
                                                },
                                                padding: {
                                                    desktop: {
                                                        all: "0px",
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px"
                                                    }
                                                },
                                                grid: { cellsType: "12" },
                                                gridSettings: {
                                                    desktop: {
                                                        flexDirection: "row"
                                                    },
                                                    "mobile-landscape": {
                                                        flexDirection: "column"
                                                    }
                                                },
                                                horizontalAlignFlex: { desktop: "flex-start" },
                                                verticalAlign: { desktop: "flex-start" }
                                            }
                                        },
                                        elements: [
                                            {
                                                id: "x0SSJvgrdD",
                                                type: "cell",
                                                data: {
                                                    settings: {
                                                        margin: {
                                                            desktop: {
                                                                top: "0px",
                                                                right: "0px",
                                                                bottom: "0px",
                                                                left: "0px",
                                                                advanced: true
                                                            }
                                                        },
                                                        padding: { desktop: { all: "0px" } },
                                                        grid: { size: 12 }
                                                    }
                                                },
                                                elements: [
                                                    {
                                                        id: "b0iE8vr2S",
                                                        type: "paragraph",
                                                        data: {
                                                            text: {
                                                                desktop: {
                                                                    type: "paragraph",
                                                                    typography: "paragraph1",
                                                                    alignment: "left",
                                                                    tag: "div",
                                                                    color: "color3"
                                                                },
                                                                data: {
                                                                    text: "Everything you need to create and deploy applications on top of the serverless infrastructure.&nbsp;<br>"
                                                                }
                                                            },
                                                            settings: {
                                                                margin: { desktop: { all: "0px" } },
                                                                padding: { desktop: { all: "0px" } }
                                                            }
                                                        },
                                                        elements: []
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        id: "JMSKwWsT_",
                                        type: "grid",
                                        data: {
                                            settings: {
                                                width: { desktop: { value: "1100px" } },
                                                margin: {
                                                    desktop: {
                                                        top: "30px",
                                                        right: "0px",
                                                        bottom: "16px",
                                                        left: "0px",
                                                        advanced: true
                                                    }
                                                },
                                                padding: {
                                                    desktop: {
                                                        all: "0px",
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px"
                                                    }
                                                },
                                                grid: { cellsType: "12" },
                                                gridSettings: {
                                                    desktop: {
                                                        flexDirection: "row"
                                                    },
                                                    "mobile-landscape": {
                                                        flexDirection: "column"
                                                    }
                                                },
                                                horizontalAlignFlex: { desktop: "flex-start" },
                                                verticalAlign: { desktop: "flex-start" }
                                            }
                                        },
                                        elements: [
                                            {
                                                id: "OU70Y990tA",
                                                type: "cell",
                                                data: {
                                                    settings: {
                                                        margin: {
                                                            desktop: {
                                                                top: "0px",
                                                                right: "0px",
                                                                bottom: "0px",
                                                                left: "0px",
                                                                advanced: true
                                                            }
                                                        },
                                                        padding: { desktop: { all: "0px" } },
                                                        grid: { size: 12 }
                                                    }
                                                },
                                                elements: [
                                                    {
                                                        id: "T_M_Ww4Wb",
                                                        type: "heading",
                                                        data: {
                                                            text: {
                                                                desktop: {
                                                                    type: "heading",
                                                                    typography: "heading4",
                                                                    alignment: "left",
                                                                    tag: "h4",
                                                                    color: "color3"
                                                                },
                                                                data: { text: "Use it to build:" }
                                                            },
                                                            settings: {
                                                                margin: { desktop: { all: "0px" } },
                                                                padding: {
                                                                    desktop: { all: "0px" }
                                                                }
                                                            }
                                                        },
                                                        elements: []
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        id: "806nmKOyc",
                                        type: "grid",
                                        data: {
                                            settings: {
                                                width: { desktop: { value: "1100px" } },
                                                margin: {
                                                    desktop: {
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px",
                                                        advanced: true
                                                    }
                                                },
                                                padding: {
                                                    desktop: {
                                                        all: "0px",
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px"
                                                    }
                                                },
                                                grid: { cellsType: "6-6" },
                                                gridSettings: {
                                                    desktop: {
                                                        flexDirection: "row"
                                                    },
                                                    "mobile-landscape": {
                                                        flexDirection: "column"
                                                    }
                                                },
                                                horizontalAlignFlex: { desktop: "flex-start" },
                                                verticalAlign: { desktop: "flex-start" }
                                            }
                                        },
                                        elements: [
                                            {
                                                id: "g59JmcyM-7",
                                                type: "cell",
                                                data: {
                                                    settings: {
                                                        margin: {
                                                            desktop: {
                                                                top: "0px",
                                                                right: "0px",
                                                                bottom: "0px",
                                                                left: "0px",
                                                                advanced: true
                                                            }
                                                        },
                                                        padding: { desktop: { all: "0px" } },
                                                        grid: { size: 6 }
                                                    }
                                                },
                                                elements: [
                                                    {
                                                        id: "Cyziie_SK",
                                                        type: "list",
                                                        data: {
                                                            text: {
                                                                desktop: {
                                                                    type: "list",
                                                                    typography: "list",
                                                                    alignment: "left",
                                                                    tag: "div",
                                                                    color: "color3"
                                                                },
                                                                data: {
                                                                    text: "<ul>\n                    <li>Full-stack applications<br></li><li>Multi-tenant solutions<br></li>\n                </ul>"
                                                                }
                                                            },
                                                            settings: {
                                                                margin: { desktop: { all: "0px" } },
                                                                padding: { desktop: { all: "0px" } }
                                                            }
                                                        },
                                                        elements: []
                                                    }
                                                ]
                                            },
                                            {
                                                id: "ST0O1ZeCk",
                                                type: "cell",
                                                data: {
                                                    settings: {
                                                        margin: {
                                                            desktop: {
                                                                top: "0px",
                                                                right: "0px",
                                                                bottom: "0px",
                                                                left: "0px",
                                                                advanced: true
                                                            }
                                                        },
                                                        padding: { desktop: { all: "0px" } },
                                                        grid: { size: 6 }
                                                    }
                                                },
                                                elements: [
                                                    {
                                                        id: "ILrAABWXiX",
                                                        type: "list",
                                                        data: {
                                                            text: {
                                                                desktop: {
                                                                    type: "list",
                                                                    typography: "list",
                                                                    alignment: "left",
                                                                    tag: "div",
                                                                    color: "color3"
                                                                },
                                                                data: {
                                                                    text: "<ul>\n                    <li>APIs</li><li>Microservice</li>\n                </ul>"
                                                                }
                                                            },
                                                            settings: {
                                                                margin: { desktop: { all: "0px" } },
                                                                padding: { desktop: { all: "0px" } }
                                                            }
                                                        },
                                                        elements: []
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        id: "XxXGeIywO",
                                        type: "grid",
                                        data: {
                                            settings: {
                                                width: { desktop: { value: "1100px" } },
                                                margin: {
                                                    desktop: {
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px",
                                                        advanced: true
                                                    }
                                                },
                                                padding: {
                                                    desktop: {
                                                        all: "0px",
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px"
                                                    }
                                                },
                                                grid: { cellsType: "12" },
                                                gridSettings: {
                                                    desktop: {
                                                        flexDirection: "row"
                                                    },
                                                    "mobile-landscape": {
                                                        flexDirection: "column"
                                                    }
                                                },
                                                horizontalAlignFlex: { desktop: "flex-start" },
                                                verticalAlign: { desktop: "flex-start" }
                                            }
                                        },
                                        elements: [
                                            {
                                                id: "9H5t3COdbo",
                                                type: "cell",
                                                data: {
                                                    settings: {
                                                        margin: {
                                                            desktop: {
                                                                top: "0px",
                                                                right: "0px",
                                                                bottom: "0px",
                                                                left: "0px",
                                                                advanced: true
                                                            }
                                                        },
                                                        padding: { desktop: { all: "0px" } },
                                                        grid: { size: 12 }
                                                    }
                                                },
                                                elements: [
                                                    {
                                                        id: "mc0_RS9rg",
                                                        type: "button",
                                                        data: {
                                                            buttonText: "Learn more",
                                                            settings: {
                                                                margin: {
                                                                    desktop: {
                                                                        all: "0px",
                                                                        advanced: true,
                                                                        top: "50px"
                                                                    }
                                                                },
                                                                horizontalAlignFlex: {
                                                                    desktop: "flex-start"
                                                                }
                                                            },
                                                            link: {
                                                                href: "https://www.webiny.com/serverless-application-framework/",
                                                                newTab: true
                                                            },
                                                            type: "primary",
                                                            icon: {
                                                                id: ["fas", "long-arrow-alt-right"],
                                                                svg: '<svg width="16" viewBox="0 0 448 512"><path d="M313.941 216H12c-6.627 0-12 5.373-12 12v56c0 6.627 5.373 12 12 12h301.941v46.059c0 21.382 25.851 32.09 40.971 16.971l86.059-86.059c9.373-9.373 9.373-24.569 0-33.941l-86.059-86.059c-15.119-15.119-40.971-4.411-40.971 16.971V216z" fill="currentColor"></path></svg>',
                                                                position: "right",
                                                                width: "16"
                                                            }
                                                        },
                                                        elements: []
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                id: "Kg3rMc1Re",
                                type: "cell",
                                data: {
                                    settings: {
                                        margin: {
                                            desktop: {
                                                top: "0px",
                                                right: "0px",
                                                bottom: "0px",
                                                left: "0px",
                                                advanced: true
                                            },
                                            "mobile-landscape": {
                                                top: "0px",
                                                right: "0px",
                                                bottom: "0px",
                                                left: "0px",
                                                all: "0px",
                                                advanced: true
                                            }
                                        },
                                        padding: {
                                            desktop: { all: "0px", advanced: true, left: "15px" },
                                            "mobile-landscape": { advanced: true, left: "0px" }
                                        },
                                        grid: { size: 6 }
                                    }
                                },
                                elements: [
                                    {
                                        id: "LAcQHMs8K",
                                        type: "grid",
                                        data: {
                                            settings: {
                                                width: { desktop: { value: "1100px" } },
                                                margin: {
                                                    desktop: {
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px",
                                                        advanced: true
                                                    }
                                                },
                                                padding: {
                                                    desktop: {
                                                        all: "0px",
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px"
                                                    }
                                                },
                                                grid: { cellsType: "12" },
                                                gridSettings: {
                                                    desktop: {
                                                        flexDirection: "row"
                                                    },
                                                    "mobile-landscape": {
                                                        flexDirection: "column"
                                                    }
                                                },
                                                horizontalAlignFlex: { desktop: "flex-start" },
                                                verticalAlign: { desktop: "flex-start" }
                                            }
                                        },
                                        elements: [
                                            {
                                                id: "8oaRz-Gko_",
                                                type: "cell",
                                                data: {
                                                    settings: {
                                                        margin: {
                                                            desktop: {
                                                                top: "0px",
                                                                right: "0px",
                                                                bottom: "0px",
                                                                left: "0px",
                                                                advanced: true
                                                            }
                                                        },
                                                        padding: { desktop: { all: "0px" } },
                                                        grid: { size: 12 }
                                                    }
                                                },
                                                elements: [
                                                    {
                                                        id: "9fQ9W-xiB",
                                                        type: "image",
                                                        data: {
                                                            settings: {
                                                                horizontalAlignFlex: {
                                                                    desktop: "center"
                                                                },
                                                                margin: { desktop: { all: "0px" } },
                                                                padding: { desktop: { all: "0px" } }
                                                            },
                                                            image: {
                                                                file: {
                                                                    id: "6022814891bd1300087bd24c",
                                                                    src: `${srcPrefix}/${get(
                                                                        fileIdToFileMap,
                                                                        `${FILE_ID_MAP.WEBINY_INFRASTRUCTURE_OVERVIEW_SVG}.key`
                                                                    )}`
                                                                }
                                                            },
                                                            link: {}
                                                        },
                                                        elements: []
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        id: "YCG34DB89",
                                        type: "grid",
                                        data: {
                                            settings: {
                                                width: { desktop: { value: "1100px" } },
                                                margin: {
                                                    desktop: {
                                                        top: "30px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px",
                                                        advanced: true
                                                    }
                                                },
                                                padding: {
                                                    desktop: {
                                                        all: "0px",
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px"
                                                    }
                                                },
                                                grid: { cellsType: "12" },
                                                gridSettings: {
                                                    desktop: {
                                                        flexDirection: "row"
                                                    },
                                                    "mobile-landscape": {
                                                        flexDirection: "column"
                                                    }
                                                },
                                                horizontalAlignFlex: { desktop: "flex-start" },
                                                verticalAlign: { desktop: "flex-start" }
                                            }
                                        },
                                        elements: [
                                            {
                                                id: "xvBXD_QTkN",
                                                type: "cell",
                                                data: {
                                                    settings: {
                                                        margin: {
                                                            desktop: {
                                                                top: "0px",
                                                                right: "0px",
                                                                bottom: "0px",
                                                                left: "0px",
                                                                advanced: true
                                                            }
                                                        },
                                                        padding: { desktop: { all: "0px" } },
                                                        grid: { size: 12 }
                                                    }
                                                },
                                                elements: [
                                                    {
                                                        id: "GqW2LBMzV",
                                                        type: "heading",
                                                        data: {
                                                            text: {
                                                                desktop: {
                                                                    type: "heading",
                                                                    typography: "heading2",
                                                                    alignment: "left",
                                                                    tag: "h2",
                                                                    color: "color3"
                                                                },
                                                                data: {
                                                                    text: "An easier way to build serverless apps"
                                                                }
                                                            },
                                                            settings: {
                                                                margin: {
                                                                    desktop: {
                                                                        all: "0px",
                                                                        advanced: true
                                                                    }
                                                                },
                                                                padding: {
                                                                    desktop: { all: "0px" }
                                                                }
                                                            }
                                                        },
                                                        elements: []
                                                    },
                                                    {
                                                        id: "9cWYQwXUd",
                                                        type: "paragraph",
                                                        data: {
                                                            text: {
                                                                desktop: {
                                                                    type: "paragraph",
                                                                    typography: "paragraph1",
                                                                    alignment: "left",
                                                                    tag: "div",
                                                                    color: "color3"
                                                                },
                                                                data: {
                                                                    text: "There are many solutions that help you run, deploy and monitor serverless functions, but when it comes to actually coding one, there are none. Webiny is a solution that helps you code your serverless app by providing you with all the components like ACL, routing, file storage and many more.<br>"
                                                                }
                                                            },
                                                            settings: {
                                                                margin: {
                                                                    desktop: {
                                                                        all: "0px",
                                                                        advanced: true,
                                                                        top: "20px"
                                                                    }
                                                                },
                                                                padding: { desktop: { all: "0px" } }
                                                            }
                                                        },
                                                        elements: []
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                id: "LxqyquKlYy",
                type: "block",
                data: {
                    settings: {
                        width: { desktop: { value: "100%" } },
                        margin: {
                            desktop: {
                                top: "0px",
                                right: "0px",
                                bottom: "0px",
                                left: "0px",
                                advanced: true
                            }
                        },
                        padding: {
                            desktop: {
                                all: "0px",
                                top: "60px",
                                right: "16px",
                                bottom: "177px",
                                left: "16px",
                                advanced: true
                            }
                        },
                        horizontalAlignFlex: { desktop: "center" },
                        verticalAlign: { desktop: "flex-start" },
                        background: {
                            desktop: {
                                image: {
                                    file: {
                                        id: "60228148f98841000981c723",
                                        src: `${srcPrefix}/${get(
                                            fileIdToFileMap,
                                            `${FILE_ID_MAP.PINK_SHAPE_SVG}.key`
                                        )}`
                                    }
                                }
                            }
                        }
                    }
                },
                elements: [
                    {
                        id: "yqrzxoDllE",
                        type: "grid",
                        data: {
                            settings: {
                                width: { desktop: { value: "1100px" } },
                                margin: {
                                    desktop: {
                                        top: "0px",
                                        right: "0px",
                                        bottom: "0px",
                                        left: "0px",
                                        advanced: true
                                    }
                                },
                                padding: {
                                    desktop: {
                                        all: "0px",
                                        top: "0px",
                                        right: "0px",
                                        bottom: "70px",
                                        left: "0px",
                                        advanced: true
                                    }
                                },
                                grid: { cellsType: "12" },
                                gridSettings: {
                                    desktop: {
                                        flexDirection: "row"
                                    },
                                    "mobile-landscape": {
                                        flexDirection: "column"
                                    }
                                },
                                horizontalAlignFlex: { desktop: "flex-start" },
                                verticalAlign: { desktop: "flex-start" }
                            }
                        },
                        elements: [
                            {
                                id: "bD-TQmZyW8",
                                type: "cell",
                                data: {
                                    settings: {
                                        margin: {
                                            desktop: {
                                                top: "0px",
                                                right: "0px",
                                                bottom: "0px",
                                                left: "0px",
                                                advanced: true
                                            }
                                        },
                                        padding: { desktop: { all: "0px" } },
                                        grid: { size: 12 }
                                    }
                                },
                                elements: [
                                    {
                                        id: "4ESAx7NxM",
                                        type: "heading",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "heading",
                                                    typography: "heading1",
                                                    alignment: "center",
                                                    tag: "h1",
                                                    color: "color3"
                                                },
                                                data: { text: "<b>Framework features</b>" }
                                            },
                                            settings: {
                                                margin: { desktop: { all: "0px" } },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        id: "Xr7NLMpzm",
                        type: "grid",
                        data: {
                            settings: {
                                width: { desktop: { value: "1100px" } },
                                margin: {
                                    desktop: {
                                        top: "0px",
                                        right: "0px",
                                        bottom: "0px",
                                        left: "0px",
                                        advanced: true
                                    }
                                },
                                padding: {
                                    desktop: {
                                        all: "0px",
                                        top: "0px",
                                        right: "0px",
                                        bottom: "0px",
                                        left: "0px"
                                    }
                                },
                                grid: { cellsType: "3-3-3-3" },
                                gridSettings: {
                                    desktop: {
                                        flexDirection: "row"
                                    },
                                    "mobile-landscape": {
                                        flexDirection: "column"
                                    }
                                },
                                horizontalAlignFlex: { desktop: "flex-start" },
                                verticalAlign: { desktop: "flex-start" }
                            }
                        },
                        elements: [
                            {
                                id: "_RtRioPOsj",
                                type: "cell",
                                data: {
                                    settings: {
                                        margin: {
                                            desktop: {
                                                top: "0px",
                                                right: "0px",
                                                bottom: "40px",
                                                left: "0px",
                                                advanced: true
                                            }
                                        },
                                        padding: {
                                            desktop: { all: "0px", advanced: true, right: "12px" },
                                            "mobile-landscape": { left: "12px", advanced: true }
                                        },
                                        grid: { size: 3 }
                                    }
                                },
                                elements: [
                                    {
                                        id: "mOr47ImJK",
                                        type: "grid",
                                        data: {
                                            settings: {
                                                width: { desktop: { value: "1100px" } },
                                                margin: {
                                                    desktop: {
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "30px",
                                                        left: "0px",
                                                        advanced: true
                                                    }
                                                },
                                                padding: {
                                                    desktop: {
                                                        all: "0px",
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px"
                                                    }
                                                },
                                                grid: { cellsType: "12" },
                                                gridSettings: {
                                                    desktop: {
                                                        flexDirection: "row"
                                                    },
                                                    "mobile-landscape": {
                                                        flexDirection: "column"
                                                    }
                                                },
                                                horizontalAlignFlex: { desktop: "flex-start" },
                                                verticalAlign: { desktop: "flex-start" }
                                            }
                                        },
                                        elements: [
                                            {
                                                id: "AlTNw-76F8",
                                                type: "cell",
                                                data: {
                                                    settings: {
                                                        margin: {
                                                            desktop: {
                                                                top: "0px",
                                                                right: "0px",
                                                                bottom: "0px",
                                                                left: "0px",
                                                                advanced: true
                                                            }
                                                        },
                                                        padding: { desktop: { all: "0px" } },
                                                        grid: { size: 12 }
                                                    }
                                                },
                                                elements: [
                                                    {
                                                        id: "r0e8MiCuK",
                                                        type: "image",
                                                        data: {
                                                            settings: {
                                                                horizontalAlignFlex: {
                                                                    desktop: "center"
                                                                },
                                                                margin: { desktop: { all: "0px" } },
                                                                padding: { desktop: { all: "0px" } }
                                                            },
                                                            image: {
                                                                file: {
                                                                    id: "6022814bef4a940008b3ba27",
                                                                    src: `${srcPrefix}/${get(
                                                                        fileIdToFileMap,
                                                                        `${FILE_ID_MAP.SECURITY_SVG}.key`
                                                                    )}`
                                                                },
                                                                height: "170px"
                                                            },
                                                            link: {}
                                                        },
                                                        elements: []
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        id: "QFwbqHtSh",
                                        type: "grid",
                                        data: {
                                            settings: {
                                                width: { desktop: { value: "1100px" } },
                                                margin: {
                                                    desktop: {
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "20px",
                                                        left: "0px",
                                                        advanced: true
                                                    }
                                                },
                                                padding: {
                                                    desktop: {
                                                        all: "0px",
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px"
                                                    }
                                                },
                                                grid: { cellsType: "12" },
                                                gridSettings: {
                                                    desktop: {
                                                        flexDirection: "row"
                                                    },
                                                    "mobile-landscape": {
                                                        flexDirection: "column"
                                                    }
                                                },
                                                horizontalAlignFlex: { desktop: "flex-start" },
                                                verticalAlign: { desktop: "flex-start" }
                                            }
                                        },
                                        elements: [
                                            {
                                                id: "DH-C0-mBsO",
                                                type: "cell",
                                                data: {
                                                    settings: {
                                                        margin: {
                                                            desktop: {
                                                                top: "0px",
                                                                right: "0px",
                                                                bottom: "0px",
                                                                left: "0px",
                                                                advanced: true
                                                            }
                                                        },
                                                        padding: { desktop: { all: "0px" } },
                                                        grid: { size: 12 }
                                                    }
                                                },
                                                elements: [
                                                    {
                                                        id: "XSN-oY3V3",
                                                        type: "heading",
                                                        data: {
                                                            text: {
                                                                desktop: {
                                                                    type: "heading",
                                                                    typography: "heading6",
                                                                    alignment: "center",
                                                                    tag: "h6",
                                                                    color: "color3"
                                                                },
                                                                data: {
                                                                    text: "<b>Users, groups, roles &amp; scopes</b>"
                                                                }
                                                            },
                                                            settings: {
                                                                margin: {
                                                                    desktop: {
                                                                        all: "0px",
                                                                        advanced: true,
                                                                        bottom: "0px"
                                                                    }
                                                                },
                                                                padding: {
                                                                    desktop: { all: "0px" }
                                                                }
                                                            }
                                                        },
                                                        elements: []
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        id: "Unyhp8o-a",
                                        type: "paragraph",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "paragraph",
                                                    typography: "paragraph2",
                                                    alignment: "center",
                                                    tag: "div",
                                                    color: "color3"
                                                },
                                                data: {
                                                    text: "Security is a crucial layer in any application. Webiny includes a full-featured security module that's connected to the built-in GraphQL API.Users, groups, roles &amp; scopes<br>"
                                                }
                                            },
                                            settings: {
                                                margin: { desktop: { all: "0px" } },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    }
                                ]
                            },
                            {
                                id: "Ntcduee0-",
                                type: "cell",
                                data: {
                                    settings: {
                                        margin: {
                                            desktop: {
                                                top: "0px",
                                                right: "0px",
                                                bottom: "0px",
                                                left: "0px",
                                                advanced: true
                                            },
                                            "mobile-landscape": { bottom: "40px", advanced: true }
                                        },
                                        padding: {
                                            desktop: {
                                                all: "0px",
                                                advanced: true,
                                                left: "12px",
                                                right: "12px"
                                            }
                                        },
                                        grid: { size: 3 }
                                    }
                                },
                                elements: [
                                    {
                                        id: "0b66dbGkG",
                                        type: "grid",
                                        data: {
                                            settings: {
                                                width: { desktop: { value: "1100px" } },
                                                margin: {
                                                    desktop: {
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "30px",
                                                        left: "0px",
                                                        advanced: true
                                                    }
                                                },
                                                padding: {
                                                    desktop: {
                                                        all: "0px",
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px"
                                                    }
                                                },
                                                grid: { cellsType: "12" },
                                                gridSettings: {
                                                    desktop: {
                                                        flexDirection: "row"
                                                    },
                                                    "mobile-landscape": {
                                                        flexDirection: "column"
                                                    }
                                                },
                                                horizontalAlignFlex: { desktop: "flex-start" },
                                                verticalAlign: { desktop: "flex-start" }
                                            }
                                        },
                                        elements: [
                                            {
                                                id: "PoRqI9i2xE",
                                                type: "cell",
                                                data: {
                                                    settings: {
                                                        margin: {
                                                            desktop: {
                                                                top: "0px",
                                                                right: "0px",
                                                                bottom: "0px",
                                                                left: "0px",
                                                                advanced: true
                                                            }
                                                        },
                                                        padding: { desktop: { all: "0px" } },
                                                        grid: { size: 12 }
                                                    }
                                                },
                                                elements: [
                                                    {
                                                        id: "0ZpnBSqjoz",
                                                        type: "image",
                                                        data: {
                                                            settings: {
                                                                horizontalAlignFlex: {
                                                                    desktop: "center"
                                                                },
                                                                margin: { desktop: { all: "0px" } },
                                                                padding: { desktop: { all: "0px" } }
                                                            },
                                                            image: {
                                                                file: {
                                                                    id: "6022814bef4a940008b3ba26",
                                                                    src: `${srcPrefix}/${get(
                                                                        fileIdToFileMap,
                                                                        `${FILE_ID_MAP.SCAFFOLDING_SVG}.key`
                                                                    )}`
                                                                },
                                                                height: "170px"
                                                            }
                                                        },
                                                        elements: []
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        id: "FFGobMHHI",
                                        type: "grid",
                                        data: {
                                            settings: {
                                                width: { desktop: { value: "1100px" } },
                                                margin: {
                                                    desktop: {
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px",
                                                        advanced: true
                                                    }
                                                },
                                                padding: {
                                                    desktop: {
                                                        all: "0px",
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px"
                                                    }
                                                },
                                                grid: { cellsType: "12" },
                                                gridSettings: {
                                                    desktop: {
                                                        flexDirection: "row"
                                                    },
                                                    "mobile-landscape": {
                                                        flexDirection: "column"
                                                    }
                                                },
                                                horizontalAlignFlex: { desktop: "flex-start" },
                                                verticalAlign: { desktop: "flex-start" }
                                            }
                                        },
                                        elements: [
                                            {
                                                id: "IWxl_nrRkr",
                                                type: "cell",
                                                data: {
                                                    settings: {
                                                        margin: {
                                                            desktop: {
                                                                top: "0px",
                                                                right: "0px",
                                                                bottom: "0px",
                                                                left: "0px",
                                                                advanced: true
                                                            }
                                                        },
                                                        padding: { desktop: { all: "0px" } },
                                                        grid: { size: 12 }
                                                    }
                                                },
                                                elements: [
                                                    {
                                                        id: "I5btsZceI",
                                                        type: "heading",
                                                        data: {
                                                            text: {
                                                                desktop: {
                                                                    type: "heading",
                                                                    typography: "heading6",
                                                                    alignment: "center",
                                                                    tag: "h6",
                                                                    color: "color3"
                                                                },
                                                                data: { text: "<b>Scaffolding</b>" }
                                                            },
                                                            settings: {
                                                                margin: { desktop: { all: "0px" } },
                                                                padding: {
                                                                    desktop: { all: "0px" }
                                                                }
                                                            }
                                                        },
                                                        elements: []
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        id: "5qvaQSnP6",
                                        type: "paragraph",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "paragraph",
                                                    typography: "paragraph2",
                                                    alignment: "center",
                                                    tag: "div",
                                                    color: "color3"
                                                },
                                                data: {
                                                    text: "Quickly generate boilerplate code using CLI plugins. From lambda functions to new GraphQL APIs.<br>"
                                                }
                                            },
                                            settings: {
                                                margin: {
                                                    desktop: {
                                                        all: "0px",
                                                        advanced: true,
                                                        top: "20px"
                                                    }
                                                },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    }
                                ]
                            },
                            {
                                id: "YHUznp7ZM5",
                                type: "cell",
                                data: {
                                    settings: {
                                        margin: {
                                            desktop: {
                                                top: "0px",
                                                right: "0px",
                                                bottom: "0px",
                                                left: "0px",
                                                advanced: true
                                            },
                                            "mobile-landscape": { bottom: "40px", advanced: true }
                                        },
                                        padding: {
                                            desktop: {
                                                all: "0px",
                                                advanced: true,
                                                left: "12px",
                                                right: "12px"
                                            }
                                        },
                                        grid: { size: 3 }
                                    }
                                },
                                elements: [
                                    {
                                        id: "PlxqV_uS7B",
                                        type: "grid",
                                        data: {
                                            settings: {
                                                width: { desktop: { value: "1100px" } },
                                                margin: {
                                                    desktop: {
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "30px",
                                                        left: "0px",
                                                        advanced: true
                                                    }
                                                },
                                                padding: {
                                                    desktop: {
                                                        all: "0px",
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px"
                                                    }
                                                },
                                                grid: { cellsType: "12" },
                                                gridSettings: {
                                                    desktop: {
                                                        flexDirection: "row"
                                                    },
                                                    "mobile-landscape": {
                                                        flexDirection: "column"
                                                    }
                                                },
                                                horizontalAlignFlex: { desktop: "flex-start" },
                                                verticalAlign: { desktop: "flex-start" }
                                            }
                                        },
                                        elements: [
                                            {
                                                id: "zKQYI-EIFl",
                                                type: "cell",
                                                data: {
                                                    settings: {
                                                        margin: {
                                                            desktop: {
                                                                top: "0px",
                                                                right: "0px",
                                                                bottom: "0px",
                                                                left: "0px",
                                                                advanced: true
                                                            }
                                                        },
                                                        padding: { desktop: { all: "0px" } },
                                                        grid: { size: 12 }
                                                    }
                                                },
                                                elements: [
                                                    {
                                                        id: "frRuzWpRI",
                                                        type: "image",
                                                        data: {
                                                            settings: {
                                                                horizontalAlignFlex: {
                                                                    desktop: "center"
                                                                },
                                                                margin: { desktop: { all: "0px" } },
                                                                padding: { desktop: { all: "0px" } }
                                                            },
                                                            image: {
                                                                file: {
                                                                    id: "60228148f98841000981c724",
                                                                    src: `${srcPrefix}/${get(
                                                                        fileIdToFileMap,
                                                                        `${FILE_ID_MAP.IDP_SVG}.key`
                                                                    )}`
                                                                },
                                                                height: "170px"
                                                            },
                                                            link: {}
                                                        },
                                                        elements: []
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        id: "M1tvv840H",
                                        type: "grid",
                                        data: {
                                            settings: {
                                                width: { desktop: { value: "1100px" } },
                                                margin: {
                                                    desktop: {
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px",
                                                        advanced: true
                                                    }
                                                },
                                                padding: {
                                                    desktop: {
                                                        all: "0px",
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px"
                                                    }
                                                },
                                                grid: { cellsType: "12" },
                                                gridSettings: {
                                                    desktop: {
                                                        flexDirection: "row"
                                                    },
                                                    "mobile-landscape": {
                                                        flexDirection: "column"
                                                    }
                                                },
                                                horizontalAlignFlex: { desktop: "flex-start" },
                                                verticalAlign: { desktop: "flex-start" }
                                            }
                                        },
                                        elements: [
                                            {
                                                id: "fwreagGdac",
                                                type: "cell",
                                                data: {
                                                    settings: {
                                                        margin: {
                                                            desktop: {
                                                                top: "0px",
                                                                right: "0px",
                                                                bottom: "0px",
                                                                left: "0px",
                                                                advanced: true
                                                            }
                                                        },
                                                        padding: { desktop: { all: "0px" } },
                                                        grid: { size: 12 }
                                                    }
                                                },
                                                elements: [
                                                    {
                                                        id: "6H1tgEViY",
                                                        type: "heading",
                                                        data: {
                                                            text: {
                                                                desktop: {
                                                                    type: "heading",
                                                                    typography: "heading6",
                                                                    alignment: "center",
                                                                    tag: "h6",
                                                                    color: "color3"
                                                                },
                                                                data: {
                                                                    text: "<b>Customizable security</b>"
                                                                }
                                                            },
                                                            settings: {
                                                                margin: { desktop: { all: "0px" } },
                                                                padding: {
                                                                    desktop: { all: "0px" }
                                                                }
                                                            }
                                                        },
                                                        elements: []
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        id: "h0Ctka4TED",
                                        type: "paragraph",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "paragraph",
                                                    typography: "paragraph2",
                                                    alignment: "center",
                                                    tag: "div",
                                                    color: "color3"
                                                },
                                                data: {
                                                    text: "Use the default AWS Cognito, or replace with 3rd party identity providers like Okta, Auth0, etc. Using plugins you can make Webiny work with any identity provider.<br>"
                                                }
                                            },
                                            settings: {
                                                margin: {
                                                    desktop: {
                                                        all: "0px",
                                                        advanced: true,
                                                        top: "20px"
                                                    }
                                                },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    }
                                ]
                            },
                            {
                                id: "SyyrOA60AF",
                                type: "cell",
                                data: {
                                    settings: {
                                        margin: {
                                            desktop: {
                                                top: "0px",
                                                right: "0px",
                                                bottom: "0px",
                                                left: "0px",
                                                advanced: true
                                            },
                                            "mobile-landscape": { advanced: true, bottom: "40px" }
                                        },
                                        padding: {
                                            desktop: { all: "0px", advanced: true, left: "12px" },
                                            "mobile-landscape": { right: "12px", advanced: true }
                                        },
                                        grid: { size: 3 }
                                    }
                                },
                                elements: [
                                    {
                                        id: "GvU31fd4U",
                                        type: "grid",
                                        data: {
                                            settings: {
                                                width: { desktop: { value: "1100px" } },
                                                margin: {
                                                    desktop: {
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "30px",
                                                        left: "0px",
                                                        advanced: true
                                                    }
                                                },
                                                padding: {
                                                    desktop: {
                                                        all: "0px",
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px"
                                                    }
                                                },
                                                grid: { cellsType: "12" },
                                                gridSettings: {
                                                    desktop: {
                                                        flexDirection: "row"
                                                    },
                                                    "mobile-landscape": {
                                                        flexDirection: "column"
                                                    }
                                                },
                                                horizontalAlignFlex: { desktop: "flex-start" },
                                                verticalAlign: { desktop: "flex-start" }
                                            }
                                        },
                                        elements: [
                                            {
                                                id: "1vAxZAkD9O",
                                                type: "cell",
                                                data: {
                                                    settings: {
                                                        margin: {
                                                            desktop: {
                                                                top: "0px",
                                                                right: "0px",
                                                                bottom: "0px",
                                                                left: "0px",
                                                                advanced: true
                                                            }
                                                        },
                                                        padding: { desktop: { all: "0px" } },
                                                        grid: { size: 12 }
                                                    }
                                                },
                                                elements: [
                                                    {
                                                        id: "dlI-qhVLKy",
                                                        type: "image",
                                                        data: {
                                                            settings: {
                                                                horizontalAlignFlex: {
                                                                    desktop: "center"
                                                                },
                                                                margin: { desktop: { all: "0px" } },
                                                                padding: { desktop: { all: "0px" } }
                                                            },
                                                            image: {
                                                                file: {
                                                                    id: "6022814bef4a940008b3ba28",
                                                                    src: `${srcPrefix}/${get(
                                                                        fileIdToFileMap,
                                                                        `${FILE_ID_MAP.ENVIRONMENTS_SVG}.key`
                                                                    )}`
                                                                },
                                                                height: "170px"
                                                            }
                                                        },
                                                        elements: []
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        id: "ftA7NOOxG",
                                        type: "grid",
                                        data: {
                                            settings: {
                                                width: { desktop: { value: "1100px" } },
                                                margin: {
                                                    desktop: {
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px",
                                                        advanced: true
                                                    }
                                                },
                                                padding: {
                                                    desktop: {
                                                        all: "0px",
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px"
                                                    }
                                                },
                                                grid: { cellsType: "12" },
                                                gridSettings: {
                                                    desktop: {
                                                        flexDirection: "row"
                                                    },
                                                    "mobile-landscape": {
                                                        flexDirection: "column"
                                                    }
                                                },
                                                horizontalAlignFlex: { desktop: "flex-start" },
                                                verticalAlign: { desktop: "flex-start" }
                                            }
                                        },
                                        elements: [
                                            {
                                                id: "WU58SBDPP8",
                                                type: "cell",
                                                data: {
                                                    settings: {
                                                        margin: {
                                                            desktop: {
                                                                top: "0px",
                                                                right: "0px",
                                                                bottom: "0px",
                                                                left: "0px",
                                                                advanced: true
                                                            }
                                                        },
                                                        padding: { desktop: { all: "0px" } },
                                                        grid: { size: 12 }
                                                    }
                                                },
                                                elements: [
                                                    {
                                                        id: "QtYfpt1yoE",
                                                        type: "heading",
                                                        data: {
                                                            text: {
                                                                desktop: {
                                                                    type: "heading",
                                                                    typography: "heading6",
                                                                    alignment: "center",
                                                                    tag: "h6",
                                                                    color: "color3"
                                                                },
                                                                data: {
                                                                    text: "<b>Multiple environments</b>"
                                                                }
                                                            },
                                                            settings: {
                                                                margin: { desktop: { all: "0px" } },
                                                                padding: {
                                                                    desktop: { all: "0px" }
                                                                }
                                                            }
                                                        },
                                                        elements: []
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        id: "mmpGUzg6o1",
                                        type: "paragraph",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "paragraph",
                                                    typography: "paragraph2",
                                                    alignment: "center",
                                                    tag: "div",
                                                    color: "color3"
                                                },
                                                data: {
                                                    text: "No code change goes directly into a production environment. Webiny CLI makes it easy to manage and create multiple environments for your project.<br>"
                                                }
                                            },
                                            settings: {
                                                margin: {
                                                    desktop: {
                                                        all: "0px",
                                                        advanced: true,
                                                        top: "20px"
                                                    }
                                                },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                id: "wYK9BhaanZ",
                type: "block",
                data: {
                    settings: {
                        width: { desktop: { value: "100%" } },
                        margin: {
                            desktop: {
                                top: "0px",
                                right: "0px",
                                bottom: "0px",
                                left: "0px",
                                advanced: true
                            }
                        },
                        padding: {
                            desktop: {
                                all: "0px",
                                top: "125px",
                                right: "16px",
                                bottom: "75px",
                                left: "16px",
                                advanced: true
                            }
                        },
                        horizontalAlignFlex: { desktop: "center" },
                        verticalAlign: { desktop: "flex-start" }
                    }
                },
                elements: [
                    {
                        id: "ur1DQFl5BR",
                        type: "grid",
                        data: {
                            settings: {
                                width: { desktop: { value: "1100px" } },
                                margin: {
                                    desktop: {
                                        top: "0px",
                                        right: "0px",
                                        bottom: "0px",
                                        left: "0px",
                                        advanced: true
                                    }
                                },
                                padding: {
                                    desktop: {
                                        all: "0px",
                                        top: "0px",
                                        right: "0px",
                                        bottom: "0px",
                                        left: "0px"
                                    }
                                },
                                grid: { cellsType: "6-6" },
                                gridSettings: {
                                    desktop: {
                                        flexDirection: "row"
                                    },
                                    "mobile-landscape": {
                                        flexDirection: "column"
                                    }
                                },
                                horizontalAlignFlex: { desktop: "flex-start" },
                                verticalAlign: { desktop: "flex-start" }
                            }
                        },
                        elements: [
                            {
                                id: "TzBvXtU2PH",
                                type: "cell",
                                data: {
                                    settings: {
                                        margin: {
                                            desktop: {
                                                top: "0px",
                                                right: "0px",
                                                bottom: "80px",
                                                left: "0px",
                                                advanced: true
                                            },
                                            "mobile-landscape": { advanced: true }
                                        },
                                        padding: {
                                            desktop: { all: "0px", advanced: true, right: "15px" },
                                            "mobile-landscape": { advanced: true, right: "0px" }
                                        },
                                        grid: { size: 6 }
                                    }
                                },
                                elements: [
                                    {
                                        id: "-PU3iBlQ4",
                                        type: "grid",
                                        data: {
                                            settings: {
                                                width: { desktop: { value: "1100px" } },
                                                margin: {
                                                    desktop: {
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px",
                                                        advanced: true
                                                    }
                                                },
                                                padding: {
                                                    desktop: {
                                                        all: "0px",
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px"
                                                    }
                                                },
                                                grid: { cellsType: "12" },
                                                gridSettings: {
                                                    desktop: {
                                                        flexDirection: "row"
                                                    },
                                                    "mobile-landscape": {
                                                        flexDirection: "column"
                                                    }
                                                },
                                                horizontalAlignFlex: { desktop: "flex-start" },
                                                verticalAlign: { desktop: "flex-start" }
                                            }
                                        },
                                        elements: [
                                            {
                                                id: "A6sNR3MR-5",
                                                type: "cell",
                                                data: {
                                                    settings: {
                                                        margin: {
                                                            desktop: {
                                                                top: "0px",
                                                                right: "0px",
                                                                bottom: "0px",
                                                                left: "0px",
                                                                advanced: true
                                                            }
                                                        },
                                                        padding: { desktop: { all: "0px" } },
                                                        grid: { size: 12 }
                                                    }
                                                },
                                                elements: [
                                                    {
                                                        id: "Xtqk_itss",
                                                        type: "image",
                                                        data: {
                                                            settings: {
                                                                horizontalAlignFlex: {
                                                                    desktop: "center"
                                                                },
                                                                margin: { desktop: { all: "0px" } },
                                                                padding: { desktop: { all: "0px" } }
                                                            },
                                                            image: {
                                                                file: {
                                                                    id: "602281486ed41f0008bc2dad",
                                                                    src: `${srcPrefix}/${get(
                                                                        fileIdToFileMap,
                                                                        `${FILE_ID_MAP.WEBINY_SERVERLESS_CMS_SVG}.key`
                                                                    )}`
                                                                },
                                                                width: "495px"
                                                            }
                                                        },
                                                        elements: []
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        id: "bsKTDygik",
                                        type: "grid",
                                        data: {
                                            settings: {
                                                width: { desktop: { value: "1100px" } },
                                                margin: {
                                                    desktop: {
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px",
                                                        advanced: true
                                                    }
                                                },
                                                padding: {
                                                    desktop: {
                                                        all: "0px",
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px"
                                                    }
                                                },
                                                grid: { cellsType: "12" },
                                                gridSettings: {
                                                    desktop: {
                                                        flexDirection: "row"
                                                    },
                                                    "mobile-landscape": {
                                                        flexDirection: "column"
                                                    }
                                                },
                                                horizontalAlignFlex: { desktop: "flex-start" },
                                                verticalAlign: { desktop: "flex-start" }
                                            }
                                        },
                                        elements: [
                                            {
                                                id: "ev9nhHISRw",
                                                type: "cell",
                                                data: {
                                                    settings: {
                                                        margin: {
                                                            desktop: {
                                                                top: "0px",
                                                                right: "0px",
                                                                bottom: "0px",
                                                                left: "0px",
                                                                advanced: true
                                                            }
                                                        },
                                                        padding: { desktop: { all: "0px" } },
                                                        grid: { size: 12 }
                                                    }
                                                },
                                                elements: [
                                                    {
                                                        id: "1BBr9ACuM",
                                                        type: "heading",
                                                        data: {
                                                            text: {
                                                                desktop: {
                                                                    type: "heading",
                                                                    typography: "heading2",
                                                                    alignment: "left",
                                                                    tag: "h2",
                                                                    color: "color3"
                                                                },
                                                                data: {
                                                                    text: "One size doesn't fit all"
                                                                }
                                                            },
                                                            settings: {
                                                                margin: { desktop: { all: "0px" } },
                                                                padding: {
                                                                    desktop: { all: "0px" }
                                                                }
                                                            }
                                                        },
                                                        elements: []
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        id: "0olguTqDN",
                                        type: "paragraph",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "paragraph",
                                                    typography: "paragraph1",
                                                    alignment: "left",
                                                    tag: "div",
                                                    color: "color3"
                                                },
                                                data: {
                                                    text: "It's a very different set of requirements a technical team has to a marketing team to a business development team. Webiny Serverless CMS comes with several different apps you can use independently, or together as part of a cohesive solution.<br>"
                                                }
                                            },
                                            settings: {
                                                margin: {
                                                    desktop: {
                                                        all: "0px",
                                                        advanced: true,
                                                        top: "20px"
                                                    }
                                                },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    }
                                ]
                            },
                            {
                                id: "BhnYb3VW7D",
                                type: "cell",
                                data: {
                                    settings: {
                                        margin: {
                                            desktop: {
                                                top: "0px",
                                                right: "0px",
                                                bottom: "0px",
                                                left: "0px",
                                                advanced: true
                                            }
                                        },
                                        padding: {
                                            desktop: { all: "0px", advanced: true, left: "15px" },
                                            "mobile-landscape": { advanced: true, left: "0px" }
                                        },
                                        grid: { size: 6 }
                                    }
                                },
                                elements: [
                                    {
                                        id: "QYZ290WhC",
                                        type: "grid",
                                        data: {
                                            settings: {
                                                width: { desktop: { value: "1100px" } },
                                                margin: {
                                                    desktop: {
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px",
                                                        advanced: true
                                                    }
                                                },
                                                padding: {
                                                    desktop: {
                                                        all: "0px",
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "30px",
                                                        left: "0px",
                                                        advanced: true
                                                    }
                                                },
                                                grid: { cellsType: "4-8" },
                                                gridSettings: {
                                                    desktop: {
                                                        flexDirection: "row"
                                                    },
                                                    "mobile-landscape": {
                                                        flexDirection: "column"
                                                    }
                                                },
                                                horizontalAlignFlex: { desktop: "flex-start" },
                                                verticalAlign: { desktop: "flex-start" },
                                                border: {
                                                    desktop: {
                                                        style: "solid",
                                                        color: "rgba(238, 238, 238, 1)",
                                                        width: { advanced: true, bottom: "1" }
                                                    }
                                                }
                                            }
                                        },
                                        elements: [
                                            {
                                                id: "ER2SFYwbeK",
                                                type: "cell",
                                                data: {
                                                    settings: {
                                                        margin: {
                                                            desktop: {
                                                                top: "0px",
                                                                right: "0px",
                                                                bottom: "0px",
                                                                left: "0px",
                                                                advanced: true
                                                            }
                                                        },
                                                        padding: { desktop: { all: "0px" } },
                                                        grid: { size: 3 }
                                                    }
                                                },
                                                elements: [
                                                    {
                                                        id: "gZp3Hxm5Js",
                                                        type: "image",
                                                        data: {
                                                            settings: {
                                                                horizontalAlignFlex: {
                                                                    desktop: "center"
                                                                },
                                                                margin: { desktop: { all: "0px" } },
                                                                padding: { desktop: { all: "0px" } }
                                                            },
                                                            image: {
                                                                file: {
                                                                    id: "602281486639200009fd35eb",
                                                                    src: `${srcPrefix}/${get(
                                                                        fileIdToFileMap,
                                                                        `${FILE_ID_MAP.SERVERLESS_CMS_LOGO_SVG}.key`
                                                                    )}`
                                                                },
                                                                height: "90px"
                                                            },
                                                            link: {}
                                                        },
                                                        elements: []
                                                    }
                                                ]
                                            },
                                            {
                                                id: "FsOaMudE8",
                                                type: "cell",
                                                data: {
                                                    settings: {
                                                        margin: {
                                                            desktop: {
                                                                top: "0px",
                                                                right: "0px",
                                                                bottom: "0px",
                                                                left: "0px",
                                                                advanced: true
                                                            }
                                                        },
                                                        padding: { desktop: { all: "0px" } },
                                                        grid: { size: 9 }
                                                    }
                                                },
                                                elements: [
                                                    {
                                                        id: "ElruSYJxWM",
                                                        type: "heading",
                                                        data: {
                                                            text: {
                                                                desktop: {
                                                                    type: "heading",
                                                                    typography: "heading3",
                                                                    alignment: "left",
                                                                    tag: "h3"
                                                                },
                                                                data: {
                                                                    text: "Webiny Serverless </p><p>CMS"
                                                                }
                                                            },
                                                            settings: {
                                                                margin: { desktop: { all: "0px" } },
                                                                padding: {
                                                                    desktop: { all: "0px" }
                                                                }
                                                            }
                                                        },
                                                        elements: []
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        id: "9HJcM89Am",
                                        type: "grid",
                                        data: {
                                            settings: {
                                                width: { desktop: { value: "1100px" } },
                                                margin: {
                                                    desktop: {
                                                        top: "30px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px",
                                                        advanced: true
                                                    }
                                                },
                                                padding: {
                                                    desktop: {
                                                        all: "0px",
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px"
                                                    }
                                                },
                                                grid: { cellsType: "12" },
                                                gridSettings: {
                                                    desktop: {
                                                        flexDirection: "row"
                                                    },
                                                    "mobile-landscape": {
                                                        flexDirection: "column"
                                                    }
                                                },
                                                horizontalAlignFlex: { desktop: "flex-start" },
                                                verticalAlign: { desktop: "flex-start" }
                                            }
                                        },
                                        elements: [
                                            {
                                                id: "8Cp2ZC30_H",
                                                type: "cell",
                                                data: {
                                                    settings: {
                                                        margin: {
                                                            desktop: {
                                                                top: "0px",
                                                                right: "0px",
                                                                bottom: "0px",
                                                                left: "0px",
                                                                advanced: true
                                                            }
                                                        },
                                                        padding: { desktop: { all: "0px" } },
                                                        grid: { size: 12 }
                                                    }
                                                },
                                                elements: [
                                                    {
                                                        id: "qrS5wswdQ",
                                                        type: "heading",
                                                        data: {
                                                            text: {
                                                                desktop: {
                                                                    type: "heading",
                                                                    typography: "heading5",
                                                                    alignment: "left",
                                                                    tag: "h5",
                                                                    color: "color3"
                                                                },
                                                                data: {
                                                                    text: "A suite of applications to help you manage your content. "
                                                                }
                                                            },
                                                            settings: {
                                                                margin: { desktop: { all: "0px" } },
                                                                padding: {
                                                                    desktop: { all: "0px" }
                                                                }
                                                            }
                                                        },
                                                        elements: []
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        id: "pLUutc-E2",
                                        type: "grid",
                                        data: {
                                            settings: {
                                                width: { desktop: { value: "1100px" } },
                                                margin: {
                                                    desktop: {
                                                        top: "50px",
                                                        right: "0px",
                                                        bottom: "20px",
                                                        left: "0px",
                                                        advanced: true
                                                    }
                                                },
                                                padding: {
                                                    desktop: {
                                                        all: "0px",
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px"
                                                    }
                                                },
                                                grid: { cellsType: "12" },
                                                gridSettings: {
                                                    desktop: {
                                                        flexDirection: "row"
                                                    },
                                                    "mobile-landscape": {
                                                        flexDirection: "column"
                                                    }
                                                },
                                                horizontalAlignFlex: { desktop: "flex-start" },
                                                verticalAlign: { desktop: "flex-start" }
                                            }
                                        },
                                        elements: [
                                            {
                                                id: "MGlDcu91q_",
                                                type: "cell",
                                                data: {
                                                    settings: {
                                                        margin: {
                                                            desktop: {
                                                                top: "0px",
                                                                right: "0px",
                                                                bottom: "0px",
                                                                left: "0px",
                                                                advanced: true
                                                            }
                                                        },
                                                        padding: { desktop: { all: "0px" } },
                                                        grid: { size: 12 }
                                                    }
                                                },
                                                elements: [
                                                    {
                                                        id: "A6rStUekq",
                                                        type: "heading",
                                                        data: {
                                                            text: {
                                                                desktop: {
                                                                    type: "heading",
                                                                    typography: "heading4",
                                                                    alignment: "left",
                                                                    tag: "h4",
                                                                    color: "color3"
                                                                },
                                                                data: {
                                                                    text: "<b>Use it to build:</b>"
                                                                }
                                                            },
                                                            settings: {
                                                                margin: { desktop: { all: "0px" } },
                                                                padding: {
                                                                    desktop: { all: "0px" }
                                                                }
                                                            }
                                                        },
                                                        elements: []
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        id: "jIdakfVZU",
                                        type: "grid",
                                        data: {
                                            settings: {
                                                width: { desktop: { value: "1100px" } },
                                                margin: {
                                                    desktop: {
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px",
                                                        advanced: true
                                                    }
                                                },
                                                padding: {
                                                    desktop: {
                                                        all: "0px",
                                                        top: "0px",
                                                        right: "0px",
                                                        bottom: "0px",
                                                        left: "0px"
                                                    }
                                                },
                                                grid: { cellsType: "6-6" },
                                                gridSettings: {
                                                    desktop: {
                                                        flexDirection: "row"
                                                    },
                                                    "mobile-landscape": {
                                                        flexDirection: "column"
                                                    }
                                                },
                                                horizontalAlignFlex: { desktop: "flex-start" },
                                                verticalAlign: { desktop: "flex-start" }
                                            }
                                        },
                                        elements: [
                                            {
                                                id: "5JHsGc_Rq-",
                                                type: "cell",
                                                data: {
                                                    settings: {
                                                        margin: {
                                                            desktop: {
                                                                top: "0px",
                                                                right: "0px",
                                                                bottom: "0px",
                                                                left: "0px",
                                                                advanced: true
                                                            }
                                                        },
                                                        padding: { desktop: { all: "0px" } },
                                                        grid: { size: 6 }
                                                    }
                                                },
                                                elements: [
                                                    {
                                                        id: "SNOFqUK6lI",
                                                        type: "list",
                                                        data: {
                                                            text: {
                                                                desktop: {
                                                                    type: "list",
                                                                    typography: "list",
                                                                    alignment: "left",
                                                                    tag: "div",
                                                                    color: "color3"
                                                                },
                                                                data: {
                                                                    text: "<ul>\n                    <li>Marketing sites</li>\n                    <li>Multi-website solutions</li>\n                    <li>Content hubs<br></li>\n                </ul>"
                                                                }
                                                            },
                                                            settings: {
                                                                margin: { desktop: { all: "0px" } },
                                                                padding: { desktop: { all: "0px" } }
                                                            }
                                                        },
                                                        elements: []
                                                    }
                                                ]
                                            },
                                            {
                                                id: "96dJBnIlc",
                                                type: "cell",
                                                data: {
                                                    settings: {
                                                        margin: {
                                                            desktop: {
                                                                top: "0px",
                                                                right: "0px",
                                                                bottom: "0px",
                                                                left: "0px",
                                                                advanced: true
                                                            }
                                                        },
                                                        padding: { desktop: { all: "0px" } },
                                                        grid: { size: 6 }
                                                    }
                                                },
                                                elements: [
                                                    {
                                                        id: "5cPfb7AwXH",
                                                        type: "list",
                                                        data: {
                                                            text: {
                                                                desktop: {
                                                                    type: "list",
                                                                    typography: "list",
                                                                    alignment: "left",
                                                                    tag: "div",
                                                                    color: "color3"
                                                                },
                                                                data: {
                                                                    text: "<ul>\n                    <li>Multi-language sites<br></li>\n                    <li>Intranet portals<br></li>\n                    <li>Headless content models<br></li>\n                </ul>"
                                                                }
                                                            },
                                                            settings: {
                                                                margin: { desktop: { all: "0px" } },
                                                                padding: { desktop: { all: "0px" } }
                                                            }
                                                        },
                                                        elements: []
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        id: "L4dFyzBKMM",
                                        type: "button",
                                        data: {
                                            buttonText: "Learn more",
                                            settings: {
                                                margin: {
                                                    desktop: {
                                                        all: "0px",
                                                        advanced: true,
                                                        top: "50px"
                                                    }
                                                },
                                                horizontalAlignFlex: {
                                                    desktop: "flex-start"
                                                }
                                            },
                                            link: {
                                                href: "https://www.webiny.com/serverless-cms/",
                                                newTab: true
                                            },
                                            type: "primary",
                                            icon: {
                                                id: ["fas", "long-arrow-alt-right"],
                                                svg: '<svg width="16" viewBox="0 0 448 512"><path d="M313.941 216H12c-6.627 0-12 5.373-12 12v56c0 6.627 5.373 12 12 12h301.941v46.059c0 21.382 25.851 32.09 40.971 16.971l86.059-86.059c9.373-9.373 9.373-24.569 0-33.941l-86.059-86.059c-15.119-15.119-40.971-4.411-40.971 16.971V216z" fill="currentColor"></path></svg>',
                                                position: "right",
                                                width: "16"
                                            }
                                        },
                                        elements: []
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                id: "mjmNmloeUS",
                type: "block",
                data: {
                    settings: {
                        width: { desktop: { value: "100%" } },
                        margin: {
                            desktop: {
                                top: "0px",
                                right: "0px",
                                bottom: "0px",
                                left: "0px",
                                advanced: true
                            }
                        },
                        padding: {
                            desktop: {
                                all: "10px",
                                advanced: true,
                                top: "80px",
                                bottom: "220px",
                                left: "16px",
                                right: "16px"
                            }
                        },
                        horizontalAlignFlex: { desktop: "center" },
                        verticalAlign: { desktop: "flex-start" },
                        background: {
                            desktop: {
                                image: {
                                    file: {
                                        id: "602281486639200009fd35ec",
                                        src: `${srcPrefix}/${get(
                                            fileIdToFileMap,
                                            `${FILE_ID_MAP.CMS_BENEFITS_SHAPE_SVG}.key`
                                        )}`
                                    }
                                }
                            }
                        }
                    }
                },
                elements: [
                    {
                        id: "xUkOEAm5X3",
                        type: "grid",
                        data: {
                            settings: {
                                width: { desktop: { value: "1100px" } },
                                margin: {
                                    desktop: {
                                        top: "0px",
                                        right: "0px",
                                        bottom: "60px",
                                        left: "0px",
                                        advanced: true
                                    }
                                },
                                padding: {
                                    desktop: {
                                        all: "0px",
                                        top: "0px",
                                        right: "0px",
                                        bottom: "0px",
                                        left: "0px"
                                    }
                                },
                                grid: { cellsType: "12" },
                                gridSettings: {
                                    desktop: {
                                        flexDirection: "row"
                                    },
                                    "mobile-landscape": {
                                        flexDirection: "column"
                                    }
                                },
                                horizontalAlignFlex: { desktop: "flex-start" },
                                verticalAlign: { desktop: "flex-start" }
                            }
                        },
                        elements: [
                            {
                                id: "Kgr1ambSuG",
                                type: "cell",
                                data: {
                                    settings: {
                                        margin: {
                                            desktop: {
                                                top: "0px",
                                                right: "0px",
                                                bottom: "0px",
                                                left: "0px",
                                                advanced: true
                                            }
                                        },
                                        padding: { desktop: { all: "0px" } },
                                        grid: { size: 12 }
                                    }
                                },
                                elements: [
                                    {
                                        id: "AP_uTrgLZ",
                                        type: "heading",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "heading",
                                                    typography: "heading1",
                                                    alignment: "center",
                                                    tag: "h1",
                                                    color: "color3"
                                                },
                                                data: { text: "<b>CMS benefits</b>" }
                                            },
                                            settings: {
                                                margin: { desktop: { all: "0px" } },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        id: "juBaAPJ76",
                        type: "grid",
                        data: {
                            settings: {
                                width: { desktop: { value: "1100px" } },
                                margin: {
                                    desktop: {
                                        top: "0px",
                                        right: "0px",
                                        bottom: "0px",
                                        left: "0px",
                                        advanced: true
                                    }
                                },
                                padding: {
                                    desktop: {
                                        all: "0px",
                                        top: "0px",
                                        right: "0px",
                                        bottom: "0px",
                                        left: "0px"
                                    }
                                },
                                grid: { cellsType: "4-4-4" },
                                gridSettings: {
                                    desktop: {
                                        flexDirection: "row"
                                    },
                                    "mobile-landscape": {
                                        flexDirection: "column"
                                    }
                                },
                                horizontalAlignFlex: { desktop: "flex-start" },
                                verticalAlign: { desktop: "flex-start" }
                            }
                        },
                        elements: [
                            {
                                id: "s95PSAToXK",
                                type: "cell",
                                data: {
                                    settings: {
                                        margin: {
                                            desktop: {
                                                top: "0px",
                                                right: "0px",
                                                bottom: "40px",
                                                left: "0px",
                                                advanced: true
                                            }
                                        },
                                        padding: {
                                            desktop: { all: "0px", advanced: true, right: "35px" },
                                            "mobile-landscape": {
                                                advanced: true,
                                                right: "35px",
                                                left: "35px"
                                            }
                                        },
                                        grid: { size: 4 }
                                    }
                                },
                                elements: [
                                    {
                                        id: "ZECp8jcZD",
                                        type: "image",
                                        data: {
                                            settings: {
                                                horizontalAlignFlex: { desktop: "center" },
                                                margin: { desktop: { all: "0px" } },
                                                padding: { desktop: { all: "0px" } }
                                            },
                                            image: {
                                                file: {
                                                    id: "60228148fa244d0008c47c79",
                                                    src: `${srcPrefix}/${get(
                                                        fileIdToFileMap,
                                                        `${FILE_ID_MAP.SCALABLE_ICON_SVG}.key`
                                                    )}`
                                                },
                                                height: "146px"
                                            },
                                            link: {}
                                        },
                                        elements: []
                                    },
                                    {
                                        id: "EyKog1RmH",
                                        type: "heading",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "heading",
                                                    typography: "heading4",
                                                    alignment: "center",
                                                    tag: "h4",
                                                    color: "color3"
                                                },
                                                data: { text: "<b>Scalable</b>" }
                                            },
                                            settings: {
                                                margin: {
                                                    desktop: {
                                                        all: "0px",
                                                        advanced: true,
                                                        top: "10px"
                                                    }
                                                },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    },
                                    {
                                        id: "_8lCcwhUN",
                                        type: "paragraph",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "paragraph",
                                                    typography: "paragraph1",
                                                    alignment: "center",
                                                    tag: "div",
                                                    color: "color3"
                                                },
                                                data: {
                                                    text: "No matter the demand, Webiny Serverless CMS can easily scale to meet even the most challenging workloads.<br>"
                                                }
                                            },
                                            settings: {
                                                margin: {
                                                    desktop: {
                                                        all: "0px",
                                                        advanced: true,
                                                        top: "10px"
                                                    }
                                                },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    }
                                ]
                            },
                            {
                                id: "SmrEQ9OZ8",
                                type: "cell",
                                data: {
                                    settings: {
                                        margin: {
                                            desktop: {
                                                top: "0px",
                                                right: "0px",
                                                bottom: "0px",
                                                left: "0px",
                                                advanced: true
                                            },
                                            "mobile-landscape": { bottom: "40px", advanced: true }
                                        },
                                        padding: {
                                            desktop: {
                                                all: "0px",
                                                advanced: true,
                                                left: "35px",
                                                right: "35px"
                                            }
                                        },
                                        grid: { size: 4 }
                                    }
                                },
                                elements: [
                                    {
                                        id: "QWM8cmlQEM",
                                        type: "image",
                                        data: {
                                            settings: {
                                                horizontalAlignFlex: { desktop: "center" },
                                                margin: { desktop: { all: "0px" } },
                                                padding: { desktop: { all: "0px" } }
                                            },
                                            image: {
                                                file: {
                                                    id: "60228145f98841000981c720",
                                                    src: `${srcPrefix}/${get(
                                                        fileIdToFileMap,
                                                        `${FILE_ID_MAP.ADAPTABLE_ICON_SVG}.key`
                                                    )}`
                                                },
                                                height: "146px"
                                            },
                                            link: {}
                                        },
                                        elements: []
                                    },
                                    {
                                        id: "TYx-A5YCI",
                                        type: "heading",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "heading",
                                                    typography: "heading4",
                                                    alignment: "center",
                                                    tag: "h4",
                                                    color: "color3"
                                                },
                                                data: { text: "<b>Adaptable</b>" }
                                            },
                                            settings: {
                                                margin: {
                                                    desktop: {
                                                        all: "0px",
                                                        advanced: true,
                                                        top: "10px"
                                                    }
                                                },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    },
                                    {
                                        id: "SsbWKZz_Z",
                                        type: "paragraph",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "paragraph",
                                                    typography: "paragraph1",
                                                    alignment: "center",
                                                    tag: "div",
                                                    color: "color3"
                                                },
                                                data: {
                                                    text: "Being an open-source project, it's easy to modify and adapt things to your own needs.<br>"
                                                }
                                            },
                                            settings: {
                                                margin: {
                                                    desktop: {
                                                        all: "0px",
                                                        advanced: true,
                                                        top: "10px"
                                                    }
                                                },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    }
                                ]
                            },
                            {
                                id: "gqdtbKfv7l",
                                type: "cell",
                                data: {
                                    settings: {
                                        margin: {
                                            desktop: {
                                                top: "0px",
                                                right: "0px",
                                                bottom: "0px",
                                                left: "0px",
                                                advanced: true
                                            },
                                            "mobile-landscape": { advanced: true, bottom: "40px" }
                                        },
                                        padding: {
                                            desktop: { all: "0px", advanced: true, left: "35px" },
                                            "mobile-landscape": { advanced: true, right: "35px" }
                                        },
                                        grid: { size: 4 }
                                    }
                                },
                                elements: [
                                    {
                                        id: "jBWaxzt-4",
                                        type: "image",
                                        data: {
                                            settings: {
                                                horizontalAlignFlex: { desktop: "center" },
                                                margin: { desktop: { all: "0px" } },
                                                padding: { desktop: { all: "0px" } }
                                            },
                                            image: {
                                                file: {
                                                    id: "6022814851197600081724ae",
                                                    src: `${srcPrefix}/${get(
                                                        fileIdToFileMap,
                                                        `${FILE_ID_MAP.COST_ICON_SVG}.key`
                                                    )}`
                                                },
                                                height: "146px"
                                            },
                                            link: {}
                                        },
                                        elements: []
                                    },
                                    {
                                        id: "NLSOIstf9",
                                        type: "heading",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "heading",
                                                    typography: "heading4",
                                                    alignment: "center",
                                                    tag: "h4",
                                                    color: "color3"
                                                },
                                                data: { text: "<b>Low cost of ownership</b>" }
                                            },
                                            settings: {
                                                margin: {
                                                    desktop: {
                                                        all: "0px",
                                                        advanced: true,
                                                        top: "10px"
                                                    }
                                                },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    },
                                    {
                                        id: "kI-neIjkXx",
                                        type: "paragraph",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "paragraph",
                                                    typography: "paragraph1",
                                                    alignment: "center",
                                                    tag: "div",
                                                    color: "color3"
                                                },
                                                data: {
                                                    text: "Self-hosted on top of serverless infrastructure. No infrastructure to mange, less people required to operate and maintain.<br>"
                                                }
                                            },
                                            settings: {
                                                margin: {
                                                    desktop: {
                                                        all: "0px",
                                                        advanced: true,
                                                        top: "10px"
                                                    }
                                                },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        id: "V14HHGmXN",
                        type: "grid",
                        data: {
                            settings: {
                                width: { desktop: { value: "1100px" } },
                                margin: {
                                    desktop: {
                                        top: "60px",
                                        right: "0px",
                                        bottom: "0px",
                                        left: "0px",
                                        advanced: true
                                    }
                                },
                                padding: {
                                    desktop: {
                                        all: "0px",
                                        top: "0px",
                                        right: "0px",
                                        bottom: "0px",
                                        left: "0px"
                                    }
                                },
                                grid: { cellsType: "4-4-4" },
                                gridSettings: {
                                    desktop: {
                                        flexDirection: "row"
                                    },
                                    "mobile-landscape": {
                                        flexDirection: "column"
                                    }
                                },
                                horizontalAlignFlex: { desktop: "flex-start" },
                                verticalAlign: { desktop: "flex-start" }
                            }
                        },
                        elements: [
                            {
                                id: "-djsQadY-8",
                                type: "cell",
                                data: {
                                    settings: {
                                        margin: {
                                            desktop: {
                                                top: "0px",
                                                right: "0px",
                                                bottom: "40px",
                                                left: "0px",
                                                advanced: true
                                            }
                                        },
                                        padding: {
                                            desktop: { all: "0px", advanced: true, right: "35px" },
                                            "mobile-landscape": { advanced: true, left: "35px" }
                                        },
                                        grid: { size: 4 }
                                    }
                                },
                                elements: [
                                    {
                                        id: "pTVeVoKkTi",
                                        type: "image",
                                        data: {
                                            settings: {
                                                horizontalAlignFlex: { desktop: "center" },
                                                margin: { desktop: { all: "0px" } },
                                                padding: { desktop: { all: "0px" } }
                                            },
                                            image: {
                                                file: {
                                                    id: "60228148f98841000981c724",
                                                    src: `${srcPrefix}/${get(
                                                        fileIdToFileMap,
                                                        `${FILE_ID_MAP.IDP_SVG}.key`
                                                    )}`
                                                },
                                                height: "146px"
                                            },
                                            link: {}
                                        },
                                        elements: []
                                    },
                                    {
                                        id: "bM5b8O7IMY",
                                        type: "heading",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "heading",
                                                    typography: "heading4",
                                                    alignment: "center",
                                                    tag: "h4",
                                                    color: "color3"
                                                },
                                                data: { text: "<b>Secure</b>" }
                                            },
                                            settings: {
                                                margin: {
                                                    desktop: {
                                                        all: "0px",
                                                        advanced: true,
                                                        top: "10px"
                                                    }
                                                },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    },
                                    {
                                        id: "l9PuI-TdVA",
                                        type: "paragraph",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "paragraph",
                                                    typography: "paragraph1",
                                                    alignment: "center",
                                                    tag: "div",
                                                    color: "color3"
                                                },
                                                data: {
                                                    text: "Secured by AWS Cognito. It's also easy to integrate services like OKTA, Auth0 and similar.<br>"
                                                }
                                            },
                                            settings: {
                                                margin: {
                                                    desktop: {
                                                        all: "0px",
                                                        advanced: true,
                                                        top: "10px"
                                                    }
                                                },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    }
                                ]
                            },
                            {
                                id: "N1lW0cAasg",
                                type: "cell",
                                data: {
                                    settings: {
                                        margin: {
                                            desktop: {
                                                top: "0px",
                                                right: "0px",
                                                bottom: "0px",
                                                left: "0px",
                                                advanced: true
                                            },
                                            "mobile-landscape": { bottom: "40px", advanced: true }
                                        },
                                        padding: {
                                            desktop: {
                                                all: "0px",
                                                advanced: true,
                                                left: "35px",
                                                right: "35px"
                                            }
                                        },
                                        grid: { size: 4 }
                                    }
                                },
                                elements: [
                                    {
                                        id: "W-ub9guhLt",
                                        type: "image",
                                        data: {
                                            settings: {
                                                horizontalAlignFlex: { desktop: "center" },
                                                margin: { desktop: { all: "0px" } },
                                                padding: { desktop: { all: "0px" } }
                                            },
                                            image: {
                                                file: {
                                                    id: "602281486ed41f0008bc2dac",
                                                    src: `${srcPrefix}/${get(
                                                        fileIdToFileMap,
                                                        `${FILE_ID_MAP.DATA_ICON_SVG}.key`
                                                    )}`
                                                },
                                                height: "146px"
                                            },
                                            link: {}
                                        },
                                        elements: []
                                    },
                                    {
                                        id: "DVhLZfrM53",
                                        type: "heading",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "heading",
                                                    typography: "heading4",
                                                    alignment: "center",
                                                    tag: "h4",
                                                    color: "color3"
                                                },
                                                data: { text: "<b>Data ownership</b>" }
                                            },
                                            settings: {
                                                margin: {
                                                    desktop: {
                                                        all: "0px",
                                                        advanced: true,
                                                        top: "10px"
                                                    }
                                                },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    },
                                    {
                                        id: "shmIumNfIu",
                                        type: "paragraph",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "paragraph",
                                                    typography: "paragraph1",
                                                    alignment: "center",
                                                    tag: "div"
                                                },
                                                data: {
                                                    text: "Webiny is self-hosted, it means your data stays within your data center. <br>"
                                                }
                                            },
                                            settings: {
                                                margin: {
                                                    desktop: {
                                                        all: "0px",
                                                        advanced: true,
                                                        top: "10px"
                                                    }
                                                },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    }
                                ]
                            },
                            {
                                id: "8F7J_16a46",
                                type: "cell",
                                data: {
                                    settings: {
                                        margin: {
                                            desktop: {
                                                top: "0px",
                                                right: "0px",
                                                bottom: "0px",
                                                left: "0px",
                                                advanced: true
                                            },
                                            "mobile-landscape": { advanced: true, bottom: "40px" }
                                        },
                                        padding: {
                                            desktop: { all: "0px", advanced: true, left: "35px" },
                                            "mobile-landscape": { advanced: true, right: "35px" }
                                        },
                                        grid: { size: 4 }
                                    }
                                },
                                elements: [
                                    {
                                        id: "2gtT4Mfw6c",
                                        type: "image",
                                        data: {
                                            settings: {
                                                horizontalAlignFlex: { desktop: "center" },
                                                margin: { desktop: { all: "0px" } },
                                                padding: { desktop: { all: "0px" } }
                                            },
                                            image: {
                                                file: {
                                                    id: "602281486ed41f0008bc2dab",
                                                    src: `${srcPrefix}/${get(
                                                        fileIdToFileMap,
                                                        `${FILE_ID_MAP.PERMISSION_ICON_SVG}.key`
                                                    )}`
                                                },
                                                height: "146px"
                                            },
                                            link: {}
                                        },
                                        elements: []
                                    },
                                    {
                                        id: "5EMJkVWgKW",
                                        type: "heading",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "heading",
                                                    typography: "heading4",
                                                    alignment: "center",
                                                    tag: "h4",
                                                    color: "color3"
                                                },
                                                data: { text: "<b>Permission control</b>" }
                                            },
                                            settings: {
                                                margin: {
                                                    desktop: {
                                                        all: "0px",
                                                        advanced: true,
                                                        top: "10px"
                                                    }
                                                },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    },
                                    {
                                        id: "cdSOjFAWkf",
                                        type: "paragraph",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "paragraph",
                                                    typography: "paragraph1",
                                                    alignment: "center",
                                                    tag: "div",
                                                    color: "color3"
                                                },
                                                data: {
                                                    text: "Powerful options to control the permissions your users will have. They perfectly align with your business requirements.&nbsp;<br>"
                                                }
                                            },
                                            settings: {
                                                margin: {
                                                    desktop: {
                                                        all: "0px",
                                                        advanced: true,
                                                        top: "10px"
                                                    }
                                                },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                id: "5ggqk561Ka",
                type: "block",
                data: {
                    settings: {
                        width: { desktop: { value: "100%" } },
                        margin: {
                            desktop: {
                                top: "0px",
                                right: "0px",
                                bottom: "0px",
                                left: "0px",
                                advanced: true
                            }
                        },
                        padding: {
                            desktop: {
                                all: "10px",
                                advanced: true,
                                top: "100px",
                                bottom: "100px",
                                left: "16px",
                                right: "16px"
                            }
                        },
                        horizontalAlignFlex: { desktop: "center" },
                        verticalAlign: { desktop: "flex-start" }
                    }
                },
                elements: [
                    {
                        id: "C6B8QfkUXs",
                        type: "grid",
                        data: {
                            settings: {
                                width: { desktop: { value: "1100px" } },
                                margin: {
                                    desktop: {
                                        top: "0px",
                                        right: "0px",
                                        bottom: "0px",
                                        left: "0px",
                                        advanced: true
                                    }
                                },
                                padding: {
                                    desktop: {
                                        all: "0px",
                                        top: "0px",
                                        right: "0px",
                                        bottom: "0px",
                                        left: "0px"
                                    }
                                },
                                grid: { cellsType: "12" },
                                gridSettings: {
                                    desktop: {
                                        flexDirection: "row"
                                    },
                                    "mobile-landscape": {
                                        flexDirection: "column"
                                    }
                                },
                                horizontalAlignFlex: { desktop: "flex-start" },
                                verticalAlign: { desktop: "flex-start" }
                            }
                        },
                        elements: [
                            {
                                id: "ChF1iOAbtb",
                                type: "cell",
                                data: {
                                    settings: {
                                        margin: {
                                            desktop: {
                                                top: "0px",
                                                right: "0px",
                                                bottom: "0px",
                                                left: "0px",
                                                advanced: true
                                            }
                                        },
                                        padding: { desktop: { all: "0px" } },
                                        grid: { size: 12 }
                                    }
                                },
                                elements: [
                                    {
                                        id: "7tRfsJ_SEz",
                                        type: "heading",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "heading",
                                                    typography: "heading1",
                                                    alignment: "center",
                                                    tag: "h1",
                                                    color: "color3"
                                                },
                                                data: {
                                                    text: "Serverless makes infrastructure easy, </p><p>Webiny makes serverless easy"
                                                }
                                            },
                                            settings: {
                                                margin: { desktop: { all: "0px" } },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        id: "oYf9t6Uwz",
                        type: "grid",
                        data: {
                            settings: {
                                width: { desktop: { value: "1100px" } },
                                margin: {
                                    desktop: {
                                        top: "80px",
                                        right: "0px",
                                        bottom: "0px",
                                        left: "0px",
                                        advanced: true
                                    }
                                },
                                padding: {
                                    desktop: {
                                        all: "0px",
                                        top: "0px",
                                        right: "0px",
                                        bottom: "0px",
                                        left: "0px"
                                    }
                                },
                                grid: { cellsType: "4-4-4" },
                                gridSettings: {
                                    desktop: {
                                        flexDirection: "row"
                                    },
                                    "mobile-landscape": {
                                        flexDirection: "column"
                                    }
                                },
                                horizontalAlignFlex: { desktop: "flex-start" },
                                verticalAlign: { desktop: "flex-start" }
                            }
                        },
                        elements: [
                            {
                                id: "RdazJP-4W1",
                                type: "cell",
                                data: {
                                    settings: {
                                        margin: {
                                            desktop: {
                                                top: "0px",
                                                right: "0px",
                                                bottom: "0px",
                                                left: "0px",
                                                advanced: true
                                            },
                                            "mobile-landscape": { advanced: true, bottom: "40px" }
                                        },
                                        padding: {
                                            desktop: { all: "0px", advanced: true, right: "50px" },
                                            "mobile-landscape": {
                                                right: "50px",
                                                advanced: true,
                                                left: "50px"
                                            }
                                        },
                                        grid: { size: 4 }
                                    }
                                },
                                elements: [
                                    {
                                        id: "7jBNW1iTi",
                                        type: "image",
                                        data: {
                                            settings: {
                                                horizontalAlignFlex: { desktop: "center" },
                                                margin: { desktop: { all: "0px" } },
                                                padding: { desktop: { all: "0px" } }
                                            },
                                            image: {
                                                file: {
                                                    id: "60228145f98841000981c721",
                                                    src: `${srcPrefix}/${get(
                                                        fileIdToFileMap,
                                                        `${FILE_ID_MAP.DEVELOPER_SVG}.key`
                                                    )}`
                                                },
                                                height: "200px"
                                            },
                                            link: {}
                                        },
                                        elements: []
                                    },
                                    {
                                        id: "npNMgLft0",
                                        type: "heading",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "heading",
                                                    typography: "heading4",
                                                    alignment: "center",
                                                    tag: "h4",
                                                    color: "color3"
                                                },
                                                data: { text: "1. Developer-friendly" }
                                            },
                                            settings: {
                                                margin: {
                                                    desktop: {
                                                        all: "0px",
                                                        advanced: true,
                                                        top: "20px"
                                                    }
                                                },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    },
                                    {
                                        id: "DpubDRaGQ",
                                        type: "paragraph",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "paragraph",
                                                    typography: "paragraph1",
                                                    alignment: "center",
                                                    tag: "div",
                                                    color: "color3"
                                                },
                                                data: {
                                                    text: "Webiny has been made with the developer in mind. It helps them develop serverless applications with ease.<br>"
                                                }
                                            },
                                            settings: {
                                                margin: {
                                                    desktop: {
                                                        all: "0px",
                                                        advanced: true,
                                                        top: "10px"
                                                    }
                                                },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    }
                                ]
                            },
                            {
                                id: "KbQocaayR",
                                type: "cell",
                                data: {
                                    settings: {
                                        margin: {
                                            desktop: {
                                                top: "0px",
                                                right: "0px",
                                                bottom: "0px",
                                                left: "0px",
                                                advanced: true
                                            },
                                            "mobile-landscape": { advanced: true, bottom: "40px" }
                                        },
                                        padding: {
                                            desktop: {
                                                all: "0px",
                                                advanced: true,
                                                left: "50px",
                                                right: "50px"
                                            }
                                        },
                                        grid: { size: 4 }
                                    }
                                },
                                elements: [
                                    {
                                        id: "KDO-Ja7wS",
                                        type: "image",
                                        data: {
                                            settings: {
                                                horizontalAlignFlex: { desktop: "center" },
                                                margin: { desktop: { all: "0px" } },
                                                padding: { desktop: { all: "0px" } }
                                            },
                                            image: {
                                                file: {
                                                    id: "60228145f98841000981c71f",
                                                    src: `${srcPrefix}/${get(
                                                        fileIdToFileMap,
                                                        `${FILE_ID_MAP.OCTO_CAT_SVG}.key`
                                                    )}`
                                                },
                                                height: "200px"
                                            },
                                            link: {}
                                        },
                                        elements: []
                                    },
                                    {
                                        id: "ETll3nkV4",
                                        type: "heading",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "heading",
                                                    typography: "heading4",
                                                    alignment: "center",
                                                    tag: "h4",
                                                    color: "color3"
                                                },
                                                data: { text: "2. Open source" }
                                            },
                                            settings: {
                                                margin: {
                                                    desktop: {
                                                        all: "0px",
                                                        advanced: true,
                                                        top: "20px"
                                                    }
                                                },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    },
                                    {
                                        id: "UWPjvO7EC",
                                        type: "paragraph",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "paragraph",
                                                    typography: "paragraph1",
                                                    alignment: "center",
                                                    tag: "div",
                                                    color: "color3"
                                                },
                                                data: {
                                                    text: 'Webiny is created and maintained by an amazing group of people. Being open source means Webiny grows and evolves much faster. <a href="https://github.com/webiny/webiny-js/blob/v5/docs/CONTRIBUTING.md">Contributor</a> are welcome.<br>'
                                                }
                                            },
                                            settings: {
                                                margin: {
                                                    desktop: {
                                                        all: "0px",
                                                        advanced: true,
                                                        top: "10px"
                                                    }
                                                },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    }
                                ]
                            },
                            {
                                id: "En4soRn06o",
                                type: "cell",
                                data: {
                                    settings: {
                                        margin: {
                                            desktop: {
                                                top: "0px",
                                                right: "0px",
                                                bottom: "0px",
                                                left: "0px",
                                                advanced: true
                                            },
                                            "mobile-landscape": { advanced: true, bottom: "50px" }
                                        },
                                        padding: {
                                            desktop: { all: "0px", advanced: true, left: "50px" },
                                            "mobile-landscape": {
                                                advanced: true,
                                                left: "50px",
                                                right: "50px"
                                            }
                                        },
                                        grid: { size: 4 }
                                    }
                                },
                                elements: [
                                    {
                                        id: "fqxeYbEV4",
                                        type: "image",
                                        data: {
                                            settings: {
                                                horizontalAlignFlex: { desktop: "center" },
                                                margin: { desktop: { all: "0px" } },
                                                padding: { desktop: { all: "0px" } }
                                            },
                                            image: {
                                                file: {
                                                    id: "60228148fa244d0008c47c7a",
                                                    src: `${srcPrefix}/${get(
                                                        fileIdToFileMap,
                                                        `${FILE_ID_MAP.COMMUNITY_ICON_SVG}.key`
                                                    )}`
                                                },
                                                height: "200px",
                                                width: "276px"
                                            },
                                            link: {}
                                        },
                                        elements: []
                                    },
                                    {
                                        id: "e5v0LBbfz",
                                        type: "heading",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "heading",
                                                    typography: "heading4",
                                                    alignment: "center",
                                                    tag: "h4",
                                                    color: "color3"
                                                },
                                                data: { text: "3. Community" }
                                            },
                                            settings: {
                                                margin: {
                                                    desktop: {
                                                        all: "0px",
                                                        advanced: true,
                                                        top: "10px"
                                                    }
                                                },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    },
                                    {
                                        id: "p9FWp5yqUy",
                                        type: "paragraph",
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "paragraph",
                                                    typography: "paragraph1",
                                                    alignment: "center",
                                                    tag: "div",
                                                    color: "color3"
                                                },
                                                data: {
                                                    text: 'We have an active community on <a href="https://webiny.com/slack">slack</a>. Talk to the core-team, and get help. Webiny team is always there for any questions.<br>'
                                                }
                                            },
                                            settings: {
                                                margin: {
                                                    desktop: {
                                                        all: "0px",
                                                        advanced: true,
                                                        top: "10px"
                                                    }
                                                },
                                                padding: { desktop: { all: "0px" } }
                                            }
                                        },
                                        elements: []
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        id: "OYp5Z-6Xo",
                        type: "grid",
                        data: {
                            settings: {
                                width: { desktop: { value: "1100px" } },
                                margin: {
                                    desktop: {
                                        top: "40px",
                                        right: "0px",
                                        bottom: "0px",
                                        left: "0px",
                                        advanced: true
                                    }
                                },
                                padding: {
                                    desktop: {
                                        all: "0px",
                                        top: "0px",
                                        right: "0px",
                                        bottom: "0px",
                                        left: "0px"
                                    }
                                },
                                grid: { cellsType: "12" },
                                gridSettings: {
                                    desktop: {
                                        flexDirection: "row"
                                    },
                                    "mobile-landscape": {
                                        flexDirection: "column"
                                    }
                                },
                                horizontalAlignFlex: { desktop: "flex-start" },
                                verticalAlign: { desktop: "flex-start" }
                            }
                        },
                        elements: [
                            {
                                id: "woaE-6v5bN",
                                type: "cell",
                                data: {
                                    settings: {
                                        margin: {
                                            desktop: {
                                                top: "0px",
                                                right: "0px",
                                                bottom: "0px",
                                                left: "0px",
                                                advanced: true
                                            }
                                        },
                                        padding: { desktop: { all: "0px" } },
                                        grid: { size: 12 }
                                    }
                                },
                                elements: [
                                    {
                                        id: "Y8ndbn88hy",
                                        type: "button",
                                        data: {
                                            buttonText: "View Webiny on GitHub",
                                            settings: {
                                                margin: { desktop: { all: "0px" } },
                                                horizontalAlignFlex: { desktop: "center" }
                                            },
                                            link: {
                                                href: "https://github.com/webiny/webiny-js",
                                                newTab: true
                                            },
                                            type: "secondary",
                                            icon: {
                                                id: ["fab", "github"],
                                                svg: '<svg width="16" viewBox="0 0 496 512"><path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z" fill="currentColor"></path></svg>',
                                                width: "16"
                                            }
                                        },
                                        elements: []
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    };
};
