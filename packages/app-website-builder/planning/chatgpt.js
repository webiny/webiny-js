/* eslint-disable */
const document = {
    id: "id#revision",
    status: "",
    revision: {},
    // Field type: "searchable-json"
    properties: {
        // Static page
        path: "/about-us",
        // Template
        templateId: "product-page",
        // Other properties
        title: "",
        description: "",
        settings: {
            tags: []
        },
        extensions: {}
    },
    // Not stored.
    state: {
        spacex: {
            launches: [{ id: "1", name: "Launch 1" }]
        },
        products: [{ id: "1", name: "Product 1" }]
    },
    // Field type: "json"
    bindings: {
        /**
         * A regular element.
         */
        "4ETOAnHNei7": {
            // Binding to a static value (this can be a scalar value, or a child element passed through a dropzone/slot).
            inputs: {
                text: {
                    static: "Hello!",
                    expression: "$.name"
                }
            },
            // Repeat this element as many times as there are items in the given collection.
            $repeat: {
                type: "expression",
                expression: "$state.spacex.launches"
            }
        },
        // A predefined block reference.
        "2B6ROAnHFao3": {
            $repeat: {
                type: "expression",
                expression: "$state.products"
            },
            /**
             * A referenced block exposes inputs that we're binding to.
             */
            "component.inputs.ABYOgFjTQhR.text": {
                type: "expression",
                expression: "$state.products.$current.name"
            }
        }
    },
    // Field type: "json"
    elements: {
        root: {
            type: "Webiny/Element",
            id: "root",
            component: {
                name: "Webiny/Root",
                inputs: {
                    children: ["4ETOAnHNei7", "2B6ROAnHFao3"]
                }
            }
        },
        "4ETOAnHNei7": {
            type: "Webiny/Element",
            id: "4ETOAnHNei7",
            parent: {
                id: "root",
                slot: "children"
            },
            component: {
                name: "Webiny/Text",
                inputs: {
                    text: `Default text`
                }
            }
        },
        "2B6ROAnHFao3": {
            type: "Webiny/Element",
            id: "2B6ROAnHFao3",
            parent: {
                id: "root",
                slot: "children"
            },
            component: {
                name: "Webiny/BlockRef",
                inputs: {
                    blockId: "B6ROAnHFao3",
                    inputs: {}
                }
            }
        }
    }
};

const query = /* GraphQL */ `
    {
        websiteBuilder {
            # Public API
            getPageByPath(path: "/about-us") {
                
            }
            
            getPageTemplate(slug: "") {
                    
            }
            # Admin
            
            
        }
    }
`;
