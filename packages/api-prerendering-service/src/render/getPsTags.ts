interface ParseAttributesOutput {
    name?: string;
    type?: string;
    key?: string;
    value?: string;
}
const parseAttributes = (content: string): ParseAttributesOutput => {
    const regex = /data-([a-zA-Z0-9-#]+)="([a-zA-Z0-9-#]+)"/gm;
    let m;

    const output: ParseAttributesOutput = {};
    while ((m = regex.exec(content)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        const [, name, value] = m;
        output[name as keyof ParseAttributesOutput] = value;
    }
    return output;
};

export default (content: string, unique = true): ParseAttributesOutput[] => {
    if (!content) {
        return [];
    }

    const psTags = [];
    const regex = /<ps-tag (.*?)>/gm;
    let m;

    while ((m = regex.exec(content)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        const [, attrs] = m;
        psTags.push(parseAttributes(attrs));
    }

    if (unique && psTags.length > 0) {
        const uniqueMap: Record<string, ParseAttributesOutput> = psTags.reduce(
            (collection, psTag) => {
                collection[psTag.key + psTag.value] = psTag;

                return collection;
            },
            {} as Record<string, ParseAttributesOutput>
        );

        return Object.values(uniqueMap);
    }
    return psTags;
};
