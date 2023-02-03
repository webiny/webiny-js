import { createAdminSettingsContext } from "@webiny/api-admin-settings";

import { createAcoGraphQL } from "~/plugins/graphql";
import { createAcoContext } from "~/plugins/context";
import { jsonField } from "~/plugins/fields";
import { createAcoHooks } from "~/plugins/hooks";

export const createACO = () => {
    return [
        ...createAdminSettingsContext(),
        createAcoContext(),
        createAcoGraphQL(),
        createAcoHooks(),
        jsonField
    ];
};
