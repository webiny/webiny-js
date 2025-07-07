import { ElementFactory } from "./ElementFactory";
import type { ComponentManifest } from "~/sdk/types";

const mockComponents: Record<string, ComponentManifest> = {
    "Webiny/Text": {
        name: "Webiny/Text",
        label: "Text",
        group: "basic",
        inputs: [
            {
                type: "text",
                renderer: "Webiny/Input",
                name: "text"
            },
            {
                type: "boolean",
                renderer: "Webiny/Checkbox",
                name: "flag"
            }
        ],
        defaults: {
            inputs: {
                text: "Hello",
                flag: true
            },
            styles: {
                color: "black"
            }
        }
    },
    "Webiny/Grid": {
        name: "Webiny/Grid",
        label: "Grid",
        group: "layout",
        inputs: [
            {
                type: "text",
                renderer: "Webiny/GridSize",
                name: "gridSize"
            },
            {
                type: "object",
                renderer: "Webiny/Object",
                name: "columns",
                list: true,
                fields: [
                    {
                        type: "slot",
                        list: false,
                        renderer: "Webiny/Slot",
                        name: "children",
                        fields: []
                    }
                ]
            }
        ],
        defaults: {
            inputs: {
                gridSize: "6-6",
                columns: [
                    {
                        children: {
                            action: "CreateElement",
                            params: {
                                component: "Webiny/GridColumn",
                                inputs: {
                                    children: [
                                        {
                                            action: "CreateElement",
                                            params: {
                                                component: "Webiny/Text",
                                                inputs: {
                                                    text: "Left Column"
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    {
                        children: {
                            action: "CreateElement",
                            params: {
                                component: "Webiny/GridColumn",
                                inputs: {
                                    children: [
                                        {
                                            action: "CreateElement",
                                            params: {
                                                component: "Webiny/Text",
                                                inputs: {
                                                    text: "Right Column"
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                ]
            },
            styles: {
                paddingTop: "10px"
            }
        }
    },
    "Webiny/GridColumn": {
        name: "Webiny/GridColumn",
        label: "Column",
        acceptsChildren: true,
        defaults: {
            styles: {
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch"
            }
        },
        inputs: [
            {
                type: "slot",
                list: true,
                renderer: "Webiny/Slot",
                name: "children",
                fields: []
            }
        ]
    }
};

test("ElementFactory generates element tree and bindings", () => {
    const factory = new ElementFactory(mockComponents);
    const result = factory.createElementFromComponent({
        componentName: "Webiny/Grid",
        parentId: "root",
        slot: "children",
        index: 0
    });
    const a = result;
});
