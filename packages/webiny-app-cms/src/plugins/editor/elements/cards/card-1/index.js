//@flow
import React from "react";
import styled from "react-emotion";
import { set } from "dot-prop-immutable";
import Card from "./Card";
import { ReactComponent as ColumnIcon } from "webiny-app-cms/editor/assets/icons/column-icon.svg";
import { createElement, cloneElement } from "webiny-app-cms/editor/utils";
import { updateElement, deleteElement } from "webiny-app-cms/editor/actions";

const PreviewBox = styled("div")({
    textAlign: "center",
    height: 50,
    svg: {
        height: 50,
        width: 50
    }
});

export default {
    name: "card-1",
    type: "cms-element",
    element: {
        title: "Card 1",
        group: "Cards",
        settings: [
            "element-settings-background",
            "",
            "element-settings-border",
            "element-settings-shadow",
            "",
            "element-settings-padding",
            "element-settings-margin",
            "",
            "element-settings-clone",
            "element-settings-delete",
            "",
            "element-settings-advanced"
        ]
    },
    target: ["column"],
    create(options = {}) {
        return {
            type: "card-1",
            elements: [
                createElement("image"),
                createElement("text", {
                    settings: {
                        style: {
                            padding: 0
                        }
                    },
                    content: {
                        typography: "headline3",
                        lipsum: {
                            count: 2,
                            units: "words"
                        }
                    }
                }),
                createElement("text", {
                    settings: {
                        style: {
                            padding: 0
                        }
                    },
                    content: {
                        typography: "subtitle1",
                        lipsum: {
                            count: 4,
                            units: "words"
                        }
                    }
                }),
                createElement("text", {
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
    preview() {
        return (
            <PreviewBox>
                <ColumnIcon />
            </PreviewBox>
        );
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
