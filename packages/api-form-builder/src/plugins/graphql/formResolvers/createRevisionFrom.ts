import { ErrorResponse, Response, NotFoundResponse } from "@webiny/graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { NotAuthorizedResponse } from "@webiny/api-security";
import { hasRwd } from "./utils/formResolversUtils";
import { FormsCRUD } from "../../../types";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    try {
        const { formBuilder } = context;
        const forms: FormsCRUD = formBuilder?.crud?.forms;

        // If permission has "rwd" property set, but "w" is not part of it, bail.
        const formBuilderFormPermission = await context.security.getPermission("forms.forms");
        if (formBuilderFormPermission && !hasRwd({ formBuilderFormPermission, rwd: "w" })) {
            return new NotAuthorizedResponse();
        }

        const sourceRev = await forms.getForm(args.revision);
        if (!sourceRev) {
            return new NotFoundResponse(`Revision with id "${args.revision}" was not found!`);
        }

        const form = await forms.createFormRevision(sourceRev);

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
