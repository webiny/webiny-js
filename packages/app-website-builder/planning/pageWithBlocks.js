 
const block = {
    // When block elements are linked, their input definitions are hoisted here.
    // This is only important for the Editor. It will be removed when rendering the actual document.
    inputs: [
        // Input for button text (`elementId` is enough to read the component name and get input definitions).
        {
            elementId: "ABYOgFjTQhR",
            inputName: "text",
            label: "Button CTA" // <-- This label can be changed by the block creator
        }
    ],
    // Interacting with the inputs will store the new values into the block's $state.
    // Within the Block editor, these changes are temporary and are not persisted.
    state: {
        "ABYOgFjTQhR.text": "A new value entered by the user"
    },
    elements: [
        {
            type: "Webiny/Element",
            id: "ABYOgFjTQhR",
            bindings: {
                // When a block element is linked, a binding to the block's $state is created.
                "component.options.text": "$state.ABYOgFjTQhR.text"
            },
            component: {
                name: "Webiny/Button",
                options: {
                    // While building the block, all input changes are applied directly to element options.
                    text: "First button",
                    openLinkInNewTab: false
                }
            }
        }
    ]
};

const pageWithBlocks = {
    // State contains all resolved data sources
    state: {
        products: {
            data: [{ id: "1", name: "Product 1" }]
        },
        spacex: {
            launches: [{ id: "1", name: "Launch 1" }]
        }
    },
    elements: [
        {
            type: "Webiny/Element",
            id: "4ETOAnHNei7",
            bindings: {
                $repeat: "$state.spacex.launches",
                "component.options.blockInput.ABYOgFjTQhR.text":
                    "$state.spacex.launches.$current.name"
            },
            component: {
                name: "Webiny/BlockRef",
                options: {
                    blockId: "B6ROAnHFao3",
                    blockInput: {
                        // Block inputs are rendered in the Editor sidebar, and as the user is interacting with the UI, new values are being stored here.
                        "ABYOgFjTQhR.text": "Click to learn more"
                    }
                }
            }
        }
    ]
};
