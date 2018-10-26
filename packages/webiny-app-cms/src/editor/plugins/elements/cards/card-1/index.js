//@flow
import React from "react";
import styled from "react-emotion";
import { set } from "dot-prop-immutable";
import Card from "./Card";
import { ReactComponent as ColumnIcon } from "webiny-app-cms/editor/assets/icons/column-icon.svg";
import { createElement, cloneElement } from "webiny-app-cms/editor/utils";
import { updateElement, deleteElement } from "webiny-app-cms/editor/actions";
import type { ElementPluginType } from "webiny-app-cms/types";

export default (): ElementPluginType => {
    const PreviewBox = styled("div")({
        textAlign: "center",
        height: 50,
        svg: {
            height: 50,
            width: 50
        }
    });

    return {
        name: "cms-element-card-1",
        type: "cms-element",
        toolbar: {
            title: "Card 1",
            group: "cms-element-group-card",
            preview() {
                return (
                    <PreviewBox>
                        <ColumnIcon />
                    </PreviewBox>
                );
            }
        },
        settings: [
            "cms-element-settings-background",
            "",
            "cms-element-settings-border",
            "cms-element-settings-shadow",
            "",
            "cms-element-settings-padding",
            "cms-element-settings-margin",
            "",
            "cms-element-settings-clone",
            "cms-element-settings-delete",
            "",
            "cms-element-settings-advanced"
        ],
        target: ["cms-element-column"],
        create(options = {}) {
            return {
                type: "cms-element-card-1",
                elements: [
                    createElement("cms-element-image"),
                    createElement("cms-element-text", {
                        settings: {
                            style: {
                                padding: 0
                            }
                        },
                        content: {
                            typography: "h3",
                            lipsum: {
                                count: 2,
                                units: "words"
                            }
                        }
                    }),
                    createElement("cms-element-text", {
                        settings: {
                            style: {
                                padding: 0
                            }
                        },
                        content: {
                            typography: "h6",
                            lipsum: {
                                count: 4,
                                units: "words"
                            }
                        }
                    }),
                    createElement("cms-element-text", {
                        settings: {
                            style: {
                                padding: 0
                            }
                        },
                        content: {
                            typography: "paragraph",
                            lipsum: {
                                count: 10,
                                units: "words"
                            }
                        }
                    })
                ],
                settings: {
                    style: {
                        padding: 10
                    }
                },
                ...options
            };
        },
        render(props) {
            return <Card {...props} />;
        },
        onReceived({ store, source, target, position = null }) {
            let element = source.path ? cloneElement(source) : createElement(source.type, {}, target);

            target = addElementToParent(element, target, position);
            store.dispatch(updateElement({ element: target }));

            if (source.path) {
                store.dispatch(deleteElement({ element: source }));
            }
        }
    };
};

const addElementToParent = (element, parent, position) => {
    if (position === null) {
        return set(parent, "elements", [...parent.elements, element]);
    }

    return set(parent, "elements", [
        ...parent.elements.slice(0, position),
        element,
        ...parent.elements.slice(position)
    ]);
};
