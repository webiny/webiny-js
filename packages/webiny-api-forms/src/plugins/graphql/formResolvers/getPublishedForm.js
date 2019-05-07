// @flow
import { Response, NotFoundResponse } from "webiny-api/graphql/responses";
import { listPublishedForms } from "./listPublishedForms";

export default async (root: any, args: Object, context: Object) => {
    if (!args.parent && !args.url) {
        return new NotFoundResponse("Form parent or URL missing.");
    }

    // We utilize the same query used for listing published forms (single source of truth = less maintenance).
    const { Form, Category } = context.forms.entities;
    const [form] = await listPublishedForms({ Form, Category, args: { ...args, perPage: 1 } });

    if (!form) {
        return new NotFoundResponse("The requested form was not found.");
    }

    return new Response(form);
};
