import { createAdminSettingsContext } from "@webiny/api-admin-settings";

import { createAcoContext } from "~/createAcoContext";
import { createAcoFields } from "~/createAcoFields";
import { createAcoGraphQL } from "~/createAcoGraphQL";

export const createAco = () => {
    return [
        ...createAdminSettingsContext(),
        createAcoContext(),
        createAcoFields(),
        createAcoGraphQL()
    ];
};
