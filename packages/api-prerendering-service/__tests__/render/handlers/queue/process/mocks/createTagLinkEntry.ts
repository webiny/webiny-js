type Entry = Record<string, any> & {
    namespace: string;
    value: string;
    url: string;
    key: string;
};

export default function ({ url, key, value, namespace }): Entry {
    return {
        namespace,
        value,
        url,
        key
    };
}
