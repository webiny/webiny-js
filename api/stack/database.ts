import MongoAtlas from "./mongoAtlas";
import DocumentDb from "./documentDb";

export default () => {
    return process.env.DATABASE === "documentdb" ? new DocumentDb() : new MongoAtlas();
};
