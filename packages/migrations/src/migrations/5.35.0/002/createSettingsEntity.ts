import { Table } from "@webiny/db-dynamodb/toolbox";
import pick from "lodash/pick";
import { createLegacyEntity, createStandardEntity } from "~/utils";

const attributes: Parameters<typeof createLegacyEntity>[2] = {
    name: {
        type: "string"
    },
    websiteUrl: {
        type: "string"
    },
    websitePreviewUrl: {
        type: "string"
    },
    favicon: {
        type: "map"
    },
    logo: {
        type: "map"
    },
    prerendering: {
        type: "map"
    },
    social: {
        type: "map"
    },
    htmlTags: {
        type: "map"
    },
    pages: {
        type: "map"
    },
    tenant: {
        type: "string"
    },
    locale: {
        type: "string"
    },
    theme: {
        type: "string"
    }
};

export const getSettingsData = (settings: any) => {
    return pick(settings, Object.keys(attributes));
};

export const createLegacySettingsEntity = (table: Table<string, string, string>) => {
    return createLegacyEntity(table, "PbSettings", attributes);
};

export const createSettingsEntity = (table: Table<string, string, string>) => {
    return createStandardEntity(table, "PB.Settings");
};
