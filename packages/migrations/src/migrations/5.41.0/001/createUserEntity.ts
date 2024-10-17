import { Table } from "@webiny/db-dynamodb/toolbox";
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
    team: {
        type: "string"
    },
    groups: {
        type: "map"
    },
    teams: {
        type: "map"
    },
    webinyVersion: {
        type: "string"
    }
};

export const createUserEntity = (table: Table<string, string, string>) => {
    return createStandardEntity(table, "AdminUsers.User", attributes);
};
