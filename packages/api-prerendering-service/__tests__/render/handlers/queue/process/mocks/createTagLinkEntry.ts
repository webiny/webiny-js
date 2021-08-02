type Entry = Record<string, any> & {
    PK: string;
    SK: string;
    TYPE: string;
    value: string;
    url: string;
    key: string;
};

export default function ({ url, key, value }): Entry {
    return {
        PK: `T#root#PS#TAG#${key}`,
        SK: `${value}#${url}`,
        TYPE: "ps.tagUrlLink",
        value,
        url,
        key
    };
}
