export const TYPE = "link";

export const isLink = i => i.type === TYPE;

export const getLinkRange = (change, selection) => {
    change.select(selection);
    let link = change.value.inlines.find(isLink);
    if (!link) {
        return selection;
    }
    // Create full link range
    const firstText = link.getFirstText();
    const lastText = link.getLastText();
    return {
        anchor: {
            path: change.value.document.getPath(firstText.key),
            offset: 0
        },
        focus: {
            path: change.value.document.getPath(lastText.key),
            offset: lastText.text.length
        }
    };
};