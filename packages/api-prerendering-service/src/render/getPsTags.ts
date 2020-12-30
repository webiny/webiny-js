const parseAttributes = content => {
    const regex = /data-([a-zA-Z0-9-#]+)="([a-zA-Z0-9-#]+)"/gm;
    let m;

    const output: any = {};
    while ((m = regex.exec(content)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        const [, name, value] = m;
        output[name] = value;
    }

    if (output.name && output.type) {
        return output;
    }
    return output;
};

export default (content, unique = true) => {
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
        const uniqueMap = {};
        for (let i = 0; i < psTags.length; i++) {
            const psTag = psTags[i];
            uniqueMap[psTag.key + psTag.value] = psTag;
        }
        return Object.values(uniqueMap);
    }
    return psTags;
};
