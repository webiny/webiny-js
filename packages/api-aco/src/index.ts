import { createAdminSettingsContext } from "@webiny/api-admin-settings";

import { createAcoContext } from "~/createAcoContext";
import { createAcoFields } from "~/createAcoFields";
import { createAcoGraphQL } from "~/createAcoGraphQL";
import { createAcoHooks } from "~/createAcoHooks";

export const createACO = () => {
    return [
        ...createAdminSettingsContext(),
        createAcoContext(),
        createAcoFields(),
        createAcoGraphQL(),
        createAcoHooks()
    ];
};
