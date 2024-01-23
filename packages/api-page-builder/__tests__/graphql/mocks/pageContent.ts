import { mdbid } from "@webiny/utils";
import bytes from "bytes";

export const calculateSize = (value: any) => {
    return new Blob([JSON.stringify(value)]).size;
};

/**
 * 1992 bytes
 */
const buildMockContent = () => {
    return {
        id: mdbid(),
        type: "document",
        data: {
            settings: {}
        },
        elements: [
            {
                id: mdbid(),
                type: "block",
                data: {
                    settings: {
                        width: {
                            desktop: {
                                value: "100%" + mdbid()
                            }
                        },
                        margin: {
                            desktop: {
                                top: "0px" + mdbid(),
                                right: "0px" + mdbid(),
                                bottom: "0px" + mdbid(),
                                left: "0px" + mdbid(),
                                advanced: true + mdbid()
                            }
                        },
                        padding: {
                            desktop: {
                                all: "10px" + mdbid()
                            }
                        },
                        horizontalAlignFlex: {
                            desktop: "center" + mdbid()
                        },
                        verticalAlign: {
                            desktop: "flex-start" + mdbid()
                        }
                    }
                },
                elements: [
                    {
                        id: mdbid(),
                        type: "grid" + mdbid(),
                        data: {
                            settings: {
                                width: {
                                    desktop: {
                                        value: "1100px" + mdbid()
                                    }
                                },
                                margin: {
                                    desktop: {
                                        top: "0px" + mdbid(),
                                        right: "0px" + mdbid(),
                                        bottom: "0px" + mdbid(),
                                        left: "0px" + mdbid(),
                                        advanced: true + mdbid()
                                    }
                                },
                                padding: {
                                    desktop: {
                                        all: "10px" + mdbid()
                                    }
                                },
                                grid: {
                                    cellsType: "12" + mdbid()
                                },
                                gridSettings: {
                                    desktop: {
                                        flexDirection: "row" + mdbid()
                                    },
                                    "mobile-landscape": {
                                        flexDirection: "column" + mdbid()
                                    }
                                },
                                horizontalAlignFlex: {
                                    desktop: "flex-start" + mdbid()
                                },
                                verticalAlign: {
                                    desktop: "flex-start" + mdbid()
                                }
                            }
                        },
                        elements: [
                            {
                                id: mdbid(),
                                type: "cell" + mdbid(),
                                data: {
                                    settings: {
                                        margin: {
                                            desktop: {
                                                top: "0px" + mdbid(),
                                                right: "0px" + mdbid(),
                                                bottom: "0px" + mdbid(),
                                                left: "0px" + mdbid(),
                                                advanced: true + mdbid()
                                            }
                                        },
                                        padding: {
                                            desktop: {
                                                all: "0px" + mdbid(),
                                                advanced: true + mdbid(),
                                                top: "80px" + mdbid()
                                            }
                                        },
                                        grid: {
                                            size: 12 + mdbid()
                                        }
                                    }
                                },
                                elements: [
                                    {
                                        id: mdbid(),
                                        type: "heading" + mdbid(),
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "heading" + mdbid(),
                                                    typography: "heading1" + mdbid(),
                                                    alignment: "center" + mdbid(),
                                                    tag: "h1" + mdbid(),
                                                    color: "color3" + mdbid()
                                                },
                                                data: {
                                                    text: "Page not found!" + mdbid()
                                                }
                                            },
                                            settings: {
                                                margin: {
                                                    desktop: {
                                                        all: "0px" + mdbid()
                                                    }
                                                },
                                                padding: {
                                                    desktop: {
                                                        all: "0px" + mdbid()
                                                    }
                                                }
                                            }
                                        },
                                        elements: []
                                    },
                                    {
                                        id: mdbid(),
                                        type: "paragraph" + mdbid(),
                                        data: {
                                            text: {
                                                desktop: {
                                                    type: "paragraph" + mdbid(),
                                                    typography: "paragraph1" + mdbid(),
                                                    alignment: "center" + mdbid(),
                                                    tag: "div" + mdbid(),
                                                    color: "color3" + mdbid()
                                                },
                                                data: {
                                                    text:
                                                        "Sorry, but the page you were looking for could not be found." +
                                                        mdbid()
                                                }
                                            },
                                            settings: {
                                                margin: {
                                                    desktop: {
                                                        all: "0px" + mdbid(),
                                                        advanced: true + mdbid(),
                                                        top: "10px" + mdbid()
                                                    }
                                                },
                                                padding: {
                                                    desktop: {
                                                        all: "0px" + mdbid()
                                                    }
                                                }
                                            }
                                        },
                                        elements: []
                                    },
                                    {
                                        id: mdbid(),
                                        type: "button" + mdbid(),
                                        data: {
                                            buttonText: "TAKE ME HOme" + mdbid(),
                                            settings: {
                                                margin: {
                                                    desktop: {
                                                        all: "0px" + mdbid(),
                                                        advanced: true + mdbid(),
                                                        top: "30px" + mdbid()
                                                    }
                                                },
                                                horizontalAlignFlex: {
                                                    desktop: "center" + mdbid()
                                                }
                                            },
                                            link: {
                                                href: "/" + mdbid()
                                            },
                                            type: "primary" + mdbid()
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
export const createPageContent = (input?: `${number}KB` | `${number}MB`) => {
    if (!input) {
        return structuredClone(buildMockContent());
    }

    const maxSize = bytes(input);
    const content = structuredClone(buildMockContent());
    let currentSize = calculateSize(content);

    while (currentSize < maxSize) {
        content.elements = content.elements.concat(buildMockContent().elements);
        currentSize = calculateSize(content);
    }
    return content;
};
