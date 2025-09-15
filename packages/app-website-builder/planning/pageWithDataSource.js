 
// Page with a data source
const pageWithDataSource = {
    dataSources: [
        {
            // State key
            name: "spacex.launches",
            // Data source type
            type: "rest",
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
    // State contains all resolved data sources (it's not persisted to DB)
    state: {
        spacex: {
            launches: [{ id: "1", name: "Launch 1" }],
            products: [{ id: "1", name: "Product 1" }]
        }
    },
    elements: [
        {
            type: "Webiny/Element",
            id: "container-1",
            bindings: {
                // $collection is a keyword which means this element needs to repeat as many times as there are items in the collection.
                $collection: "$state.spacex.launches"
            },
            component: {
                name: "Webiny/Container",
                options: {
                    children: [
                        {
                            type: "Webiny/Element",
                            version: 1,
                            id: "4ETOAnHNei7",
                            bindings: {
                                // "$current" is a dynamically calculated value based on the "$state.spacex.launches" data source, bound to the parent container.
                                "component.options.text": "$state.spacex.launches.$current.name"
                            },
                            component: {
                                name: "Webiny/Text",
                                options: {
                                    text: "Hello!"
                                }
                            }
                        }
                    ]
                }
            }
        }
    ]
};
