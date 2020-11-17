import { ErrorResponse, Response } from "@webiny/graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { NotAuthorizedResponse } from "@webiny/api-security";
import { hasRwd } from "./utils/formResolversUtils";
import { FormsCRUD } from "../../../types";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    const { formBuilder } = context;
    const forms: FormsCRUD = formBuilder?.crud?.forms;
    const { data } = args;

    // If permission has "rwd" property set, but "w" is not part of it, bail.
    const formBuilderFormPermission = await context.security.getPermission("forms.forms");
    if (formBuilderFormPermission && !hasRwd({ formBuilderFormPermission, rwd: "w" })) {
        return new NotAuthorizedResponse();
    }

    try {
        const form = await forms.createForm(data);

        return new Response(form);
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
};

export default resolver;
