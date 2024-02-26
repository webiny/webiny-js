import { addElementId } from "~/editor/helpers";

export const getDefaultBlockContent = () => {
    return addElementId({
        type: "block",
        data: {
            settings: {
                width: {
                    desktop: {
                        value: "100%"
                    }
                },
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
                        all: "10px"
                    }
                },
                horizontalAlignFlex: {
                    desktop: "center"
                },
                verticalAlign: {
                    desktop: "flex-start"
                }
            }
        },
        elements: [
            {
                id: "nbLftfYqrg",
                type: "grid",
                data: {
                    settings: {
                        width: {
                            desktop: {
                                value: "1100px"
                            }
                        },
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
                                all: "10px"
                            }
                        },
                        grid: {
                            cellsType: "12"
                        },
                        gridSettings: {
                            desktop: {
                                flexDirection: "row"
                            },
                            "mobile-landscape": {
                                flexDirection: "column"
                            }
                        },
                        horizontalAlignFlex: {
                            desktop: "flex-start"
                        },
                        verticalAlign: {
                            desktop: "flex-start"
                        }
                    }
                },
                elements: [
                    {
                        id: "FoKq0fZfr4",
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
                                    desktop: {
                                        all: "0px"
                                    }
                                },
                                grid: {
                                    size: 12
                                }
                            }
                        },
                        elements: [],
                        path: ["sUK8viY2oz", "eM2Z1d9gfH", "nbLftfYqrg"]
                    }
                ],
                path: ["sUK8viY2oz", "eM2Z1d9gfH"]
            }
        ]
    });
};
