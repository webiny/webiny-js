export const isLexicalElement = (obj: Record<string, any>) => {
    return !!obj["children"] && !!obj?.type;
};
