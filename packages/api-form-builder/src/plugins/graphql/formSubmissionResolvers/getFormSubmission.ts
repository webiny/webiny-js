import { Response, NotFoundResponse, ListResponse } from "@webiny/graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";

export async function getFormSubmission(context, formId, fieldId, value) {
    const { FormSubmission } = context.models;

    const query = {
        "form.parent": formId
    };
    const fieldName = `data.${fieldId}`;
    query[fieldName] = value;

    console.log(`Got unique info ${formId} ${fieldId} ${value}. Running query: ${JSON.stringify(query)}`);
    const submissions = await FormSubmission.find({ query });
    if (!submissions) {
        return new NotFoundResponse("The requested form was not found.");
    }
    console.log(`Found ${submissions.length} submissions`);
    return submissions;
}

/**
 * Returns form submission by given form ID, field ID, and value
 * @param root
 * @param args
 * @param context
 * @returns {Promise<NotFoundResponse|Response>}
 */
const resolver: GraphQLFieldResolver = async (root, args, context, info) => {
    if (!args.formId && !args.fieldId && !args.value) {
        return new NotFoundResponse("Form ID, Field ID, or Value is missing.");
    }
    const submissions = await getFormSubmission(context, args.formId, args.fieldId, args.value);
    return new ListResponse(submissions, submissions.getMeta());
};

export default resolver;
