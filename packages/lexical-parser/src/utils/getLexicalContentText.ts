export const getLexicalContentText = (node: Record<string, any>): string => {
    try {
        return traverse(node, "text");
    } catch {
        return "";
    }
};

const traverse = (content: Record<string, any>, key: string): string => {
    if (content.hasOwnProperty(key)) {
        return content[key];
    }

    if (Array.isArray(content)) {
        return content.map(c => traverse(c, key)).join(" ");
    }

    for (const property in content) {
        return traverse(content[property], key);
    }

    return "";
};
