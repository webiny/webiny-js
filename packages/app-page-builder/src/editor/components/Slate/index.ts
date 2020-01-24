import Slate from "./Slate";

/**
 * Create Slate editor value object using given text and typography.
 *
 * @param text
 * @param typography
 * @returns {{object, document}}
 */
export const createValue = (text, typography = "body1") => {
    return createDocument(createTextLeaf(text), typography);
};

/**
 * Create Slate editor text leaf
 * @param text
 * @returns {{object: string, text: *}}
 */
const createTextLeaf = text => {
    return { object: "leaf", text };
};

/**
 * Create Slate editor document
 * @param leaf
 * @param typography
 * @returns {{object: string, document: {object: string, nodes: *[]}}}
 */
const createDocument = (leaf, typography = "body1") => {
    return {
        object: "value",
        document: {
            object: "document",
            nodes: [
                {
                    object: "block",
                    type: typography,
                    nodes: [
                        {
                            object: "text",
                            leaves: [leaf]
                        }
                    ]
                }
            ]
        }
    };
};

export default Slate;
