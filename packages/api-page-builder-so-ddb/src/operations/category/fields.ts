import { FieldPathPlugin } from "@webiny/db-dynamodb/plugins/definitions/FieldPathPlugin";

const createdBy = new FieldPathPlugin({
    fields: ["createdBy"],
    createPath: () => {
        return "createdBy.id";
    }
});

export default () => {
    return [createdBy];
};
