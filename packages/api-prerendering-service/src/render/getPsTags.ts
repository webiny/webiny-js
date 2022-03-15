import { TagUrlLink } from "~/types";

const parseAttributes = (content: string): TagUrlLink => {
    const regex = /data-([a-zA-Z0-9-#]+)="([a-zA-Z0-9-#]+)"/gm;
    let m;

    const output: Partial<TagUrlLink> = {};
    while ((m = regex.exec(content)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        const [, name, value] = m;
        output[name as keyof TagUrlLink] = value;
    }
    return output as TagUrlLink;
};

export default (content: string, unique = true): TagUrlLink[] => {
    if (!content) {
        return [];
    }

    const psTags: TagUrlLink[] = [];
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
        const uniqueMap: Record<string, TagUrlLink> = psTags.reduce((collection, psTag) => {
            collection[`${psTag.key || ""}${psTag.value || ""}`] = psTag;

            return collection;
        }, {} as Record<string, TagUrlLink>);

        return Object.values(uniqueMap);
    }
    return psTags;
};
