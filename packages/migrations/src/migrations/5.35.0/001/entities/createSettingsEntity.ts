import { Table } from "dynamodb-toolbox";
import pick from "lodash.pick";
import { createLegacyEntity, createStandardEntity } from "~/utils";

const attributes: Parameters<typeof createLegacyEntity>[2] = {
    tenant: {
        type: "string"
    },
    srcPrefix: {
        type: "string"
    },
    uploadMaxFileSize: {
        type: "number"
    },
    uploadMinFileSize: {
        type: "number"
    }
};

export const getSettingsData = (settings: any) => {
    return pick(settings, Object.keys(attributes));
};

export const createLegacySettingsEntity = (table: Table) => {
    return createLegacyEntity(table, "Settings", attributes);
};

export const createSettingsEntity = (table: Table) => {
    return createStandardEntity(table, "FM.Settings");
};
