const searchDataByKey = (searchKey, object) => {
    if (!object || typeof object !== "object") {
        return null;
    }

    for (let key in object) {
        if (key === searchKey) {
            return object.data;
        }

        return searchDataByKey(searchKey, object[key]);
    }

    return null;
};

export default searchDataByKey;
