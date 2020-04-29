const parseAttributes = content => {
    const regex = /data-([a-zA-Z0-9-]+)="([a-zA-Z0-9-]+)"/gm;
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

export default content => {
    if (!content) {
        return [];
    }

    const cacheTags = [];
    const regex = /<ssr-cache (.*?)>/gm;
    let m;

    while ((m = regex.exec(content)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        const [, attrs] = m;
        cacheTags.push(parseAttributes(attrs));
    }

    return cacheTags;
};
