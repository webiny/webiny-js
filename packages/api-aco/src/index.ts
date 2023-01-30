import { createAdminSettingsContext } from "@webiny/api-admin-settings";

import { createAcoGraphQL } from "~/plugins/graphql";
import { createAcoContext } from "~/plugins/context";
import { jsonField } from "~/plugins/fields";

export const createAco = () => {
    return [...createAdminSettingsContext(), createAcoContext(), createAcoGraphQL(), jsonField];
};
