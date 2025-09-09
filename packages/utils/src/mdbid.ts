import ObjectID from "bson-objectid";

export const mdbid = () => {
    return ObjectID().toHexString();
};
