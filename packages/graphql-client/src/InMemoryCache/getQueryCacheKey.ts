const generateCacheKey = data => {
    const str = JSON.stringify(data);
    let h, i, l;
    for (h = 5381 | 0, i = 0, l = str.length | 0; i < l; i++) {
        h = (h << 5) + h + str.charCodeAt(i);
    }

    return h >>> 0;
};

export default (query, variables = {}) => {
    return [generateCacheKey(query), generateCacheKey(variables)];
};
