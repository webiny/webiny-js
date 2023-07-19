const unlinkElements = (
    templateBlockVariables: Record<string, any>,
    elements: Array<Record<string, any>>
): any => {
    return elements.reduce((current, item) => {

    }, [])

};

export const unlinkPageContentFromTemplate = (
    linkedPage: any,
    resolvedPageDocumentElements: any
) => {
    // Remove "template" from the linked page content data.
    const { template: templateData, ...filteredContentData } = linkedPage.content.data;

    const unlinkedElements = [];
    for (let i = 0; i < resolvedPageDocumentElements.length; i++) {
        const currentBlockElement = resolvedPageDocumentElements[i];

        const templateBlockId = currentBlockElement.data.templateBlockId;
        const templateBlockVariables = templateData.variables.find(
            (item: any) => item.blockId === templateBlockId
        ).variables;

        unlinkedElements.push(unlinkElements(templateBlockVariables, currentBlockElement.elements));
    }

    return {
        ...linkedPage.content,
        data: filteredContentData,
        elements: unlinkedElements
    };
};
