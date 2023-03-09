export const getLexicalContentText = (value: string): string => {
    if (!isValidJSON(value)) {
        return value;
    }

    return traverse(JSON.parse(value), "text");
};

const isValidJSON = (value: string): boolean => {
    try {
        const o = JSON.parse(value);
        return !!o && typeof o === "object" && !Array.isArray(o);
    } catch {
        return false;
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
