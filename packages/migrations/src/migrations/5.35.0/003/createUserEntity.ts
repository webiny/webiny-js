import { Table } from "@webiny/db-dynamodb/toolbox";
import pick from "lodash/pick";
import { createLegacyEntity, createStandardEntity } from "~/utils";

const attributes: Parameters<typeof createLegacyEntity>[2] = {
    id: {
        type: "string"
    },
    tenant: {
        type: "string"
    },
    email: {
        type: "string"
    },
    firstName: {
        type: "string"
    },
    lastName: {
        type: "string"
    },
    avatar: {
        type: "map"
    },
    createdBy: {
        type: "map"
    },
    createdOn: {
        type: "string"
    },
    group: {
        type: "string"
    },
    webinyVersion: {
        type: "string"
    }
};

export const getUserData = (user: any) => {
    return pick(user, Object.keys(attributes));
};

export const createLegacyUserEntity = (table: Table<string, string, string>) => {
    return createLegacyEntity(table, "AdminUsers.User", attributes);
};

export const createUserEntity = (table: Table<string, string, string>) => {
    return createStandardEntity(table, "AdminUsers.User", attributes);
};
