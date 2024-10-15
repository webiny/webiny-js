export const createObjectHash = (object: Record<string, any>) => {
    const jsonString = JSON.stringify(object);

    // Create a hash string from string.
    if (jsonString.length === 0) {
        return 0;
    }

    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
        const charCode = jsonString.charCodeAt(i);
        hash = (hash << 5) - hash + charCode;
        hash |= 0; // Convert to 32bit integer
    }

    return hash;
};