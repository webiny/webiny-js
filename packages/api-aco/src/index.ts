import { createAdminSettingsContext } from "@webiny/api-admin-settings";

import { createAcoContext } from "~/plugins/context";
import { createAcoFields } from "~/plugins/fields";
import { createAcoGraphQL } from "~/plugins/graphql";
import { createAcoHooks } from "~/plugins/hooks";

export const createACO = () => {
    return [
        ...createAdminSettingsContext(),
        createAcoContext(),
        createAcoFields(),
        createAcoGraphQL(),
        createAcoHooks()
    ];
};
