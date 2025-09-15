 
// Page from template
const pageFromTemplate = {
    // Field type: "searchable-json"
    // This is a container for arbitrary system data.
    properties: {
        template: {
            id: "21ETOAnHNei7"
        },
        title: "SpaceX Launches",
        description: "",
        image: "",
        seo: {
            title: "",
            description: "",
            tags: []
        }
    },
    // Field type: "searchable-json"
    // This is a container for arbitrary user data.
    extensions: {
        publishOn: "2021-01-01T00:00:00.000Z"
    },
    // Field type: "object"
    dataSources: [
        {
            // State key
            name: "spacex.launches",
            // Data source type
            type: "rest",
            // Field type: "json"
            config: {
                url: "https://api.spacexdata.com/v5/launches",
                method: "GET",
                queryParams: {
                    limit: 1,
                    apiKey: "f1a790f8c3204b3b8c5c1795aeac4660"
                },
                headers: {
                    Authorization: "Bearer f1a790f8c3204b3b8c5c1795aeac4660"
                }
            }
        },
        {
            // State key
            name: "products",
            // Data source type
            type: "graphql",
            // Field type: "json"
            config: {
                url: "https://api.webiny.com/graphql",
                method: "POST",
                query: `
        query GetProducts($limit: Int) {
          products(limit: $limit) {
            data {
              id
              name
            }
          }
      `,
                variables: {
                    limit: 1
                },
                headers: {
                    Authorization: "Bearer f1a790f8c3204b3b8c5c1795aeac4660"
                }
            }
        }
    ],
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
            "component.inputs.text": {
                type: "static",
                value: "Hello!"
            },
            // Repeat this element as many times as there are items in the given collection.
            $repeat: {
                type: "expression",
                expression: "$state.spacex.launches"
            },
            // Binding to a dynamic value.
            "component.inputs.text": {
                type: "expression",
                expression: "$state.spacex.launches.$current.name"
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
    elements: [
        {
            type: "Webiny/Element",
            id: "4ETOAnHNei7",
            component: {
                name: "Webiny/Text",
                inputs: {
                    text: "Hello!"
                }
            },
            // Each element defined within a template needs to have a `source: "template"` flag set.
            source: "template",
            inputs: [
                {
                    inputName: "text",
                    label: "Product title",
                    target: "component.inputs.text"
                }
            ]
        },
        {
            type: "Webiny/Element",
            id: "2B6ROAnHFao3",
            component: {
                // Block refs will be resolved using a `BlocksRepository`. This component will fetch and render
                // the actual block, using the inputs passed from the parent element container.
                name: "Webiny/BlockRef",
                inputs: {
                    blockId: "B6ROAnHFao3",
                    inputs: {}
                }
            }
        }
    ]
};
