const searchDataByKey = (searchKey, object) => {
    if (!object || typeof object !== "object") {
        return null;
    }

    if (object[searchKey]) {
        return object[searchKey];
    }

    for (let key in object) {
        const value = searchDataByKey(searchKey, object[key]);
        if (value) {
            return value;
        }
    }

    return null;
};

export default searchDataByKey;
