import { CmsGraphQLSchemaPlugin } from "@webiny/api-headless-cms";
import OpenAI from "openai";
import type { CmsContext as Context } from "@webiny/api-headless-cms/types/index.js";

/*
 * This file adds a GraphQL schema for comparing content entry revisions.
 * It defines a compareEntryRevisions query that takes two revision IDs,
 * fetches their content from the CMS, and uses OpenAI to compare them.
 * The query outputs comparison results.
 * It uses Webiny's CmsGraphQLSchemaPlugin to extend the Headless CMS GraphQL API.
 */

const OPENAI_API_KEY = process.env["WEBINY_API_OPEN_AI_API_KEY"];

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export const compareEntryRevisions = () => [
    new CmsGraphQLSchemaPlugin<Context>({
        typeDefs: `
            type ComparisonData {
                html: String
                summary: String
            }

            input CompareRevisionsInput {
                revisionId1: String!
                revisionId2: String!
                modelId: String!
            }

            type Query {
                compareEntryRevisions(input: CompareRevisionsInput!): ComparisonData
            }
        `,
        resolvers: {
            Query: {
                compareEntryRevisions: async (_, { input }, context: Context) => {
                    try {
                        const { revisionId1, revisionId2, modelId } = input;

                        // Get the CMS context
                        const cms = context.cms;
                        if (!cms) {
                            throw new Error("CMS context not available");
                        }

                        // Fetch both revisions from the CMS
                        let entryRevision1, entryRevision2;
                        let model, entryRevision1Values, entryRevision2Values;

                        try {
                            console.log("Model ID:", modelId);

                            // First, get the model to ensure it exists and is properly formatted
                            model = await cms.getModel(modelId);
                            if (!model) {
                                throw new Error(`Model '${modelId}' not found`);
                            }

                            console.log("Model found:", model.modelId);


                            entryRevision1 = await cms.getEntryById(model, revisionId1)
                            console.log("=== revision1 getEntryById", entryRevision1);

                            entryRevision2 = await cms.getEntryById(model, revisionId2)
                            console.log("=== revision2 getEntryById", entryRevision2);

                            entryRevision1Values = entryRevision1.values;
                            entryRevision2Values = entryRevision2.values;

                            console.log("=== entryRevision1Values", entryRevision1Values);
                            console.log("=== entryRevision2Values", entryRevision2Values);

                        } catch (fetchError) {
                            console.error("Error fetching revisions:", fetchError);
                            throw new Error("Failed to fetch content entry revisions");
                        }

                        // Prepare content for OpenAI comparison using the new content intelligence prompt
                        const comparisonPrompt = `
                        CONTENT MODEL STRUCTURE:
                        ${JSON.stringify(model.fields, null, 2)}

                        VERSION A:
                        ${JSON.stringify(entryRevision1Values, null, 2)}

                        VERSION B:
                        ${JSON.stringify(entryRevision2Values, null, 2)}
                        `;

                        // Call OpenAI to compare the revisions
                        const response = await openai.chat.completions.create({
                            model: "gpt-3.5-turbo",
                            messages: [
                                {
                                    role: "system",
                                    content: `You are a content intelligence assistant specialized in version comparison for headless CMS platforms like Webiny.

I will provide:

1. The content model structure that defines the schema of the entry.
2. Two versions of the content entry in JSON format: versionA and versionB.

Your task:

- Parse both versions according to the schema provided in the content model.
- Identify all differences between versionA and versionB.
- For each difference, explain:
    - The field name
    - The value in versionA
    - The value in versionB
    - A brief summary of the change (e.g., "Title changed from 'Old' to 'New'")
- If nested fields or objects exist, perform a deep comparison.
- Preserve field labels and types from the content model for accuracy in reporting.
- Return the comparison in clean HTML format with proper styling.

Example output format:

<div class="comparison-report">
    <table class="comparison-table">
        <thead>
            <tr>
                <th>Field</th>
                <th>Version A</th>
                <th>Version B</th>
                <th>Change Summary</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>title</strong></td>
                <td>Launch Plan</td>
                <td>Updated Launch Plan</td>
                <td>Title changed from 'Launch Plan' to 'Updated Launch Plan'</td>
            </tr>
            <tr>
                <td><strong>description</strong></td>
                <td>Initial phase</td>
                <td>Initial + Testing</td>
                <td>Description updated</td>
            </tr>
            <tr>
                <td><strong>tags</strong></td>
                <td>["alpha"]</td>
                <td>["alpha", "beta"]</td>
                <td>Tag 'beta' added</td>
            </tr>
        </tbody>
    </table>
</div>

If no differences are found, return: <div class="no-changes"><h3>No differences detected between Version A and Version B.</h3></div>

Use semantic HTML and include appropriate classes for styling. Do not include <style> tags or CSS - only return the HTML structure.`
                                },
                                {
                                    role: "user",
                                    content: comparisonPrompt
                                }
                            ],
                            temperature: 0.7,
                            max_tokens: 1000,
                            top_p: 1
                        });

                        const messageContent = response?.choices?.[0]?.message?.content;

                        if (typeof messageContent !== "string") {
                            console.error("Invalid or null content received from OpenAI.");
                            throw new Error("Failed to get a valid response from OpenAI.");
                        }

                        // Extract summary from the HTML content (look for h2 or h3 text, or first paragraph)
                        const htmlContent = messageContent;

                        console.log("=== 178 htmlContent", htmlContent);
                        // Try to extract summary from HTML - look for heading text or first meaningful content
                        const headingMatch = htmlContent.match(/<h[2-3][^>]*>([^<]+)<\/h[2-3]>/);
                        const paragraphMatch = htmlContent.match(/<p[^>]*>([^<]+)<\/p>/);
                        const noChangesMatch = htmlContent.match(/No differences detected/);

                        let summary = "Content comparison completed";
                        if (noChangesMatch) {
                            summary = "No differences detected between versions";
                        } else if (headingMatch) {
                            summary = headingMatch[1].trim();
                        } else if (paragraphMatch) {
                            summary = paragraphMatch[1].trim();
                        }

                        return {
                            html: htmlContent,
                            summary: summary
                        };
                    } catch (error) {
                        console.error("Error comparing entry revisions:", error);
                        throw new Error("Failed to compare entry revisions.");
                    }
                }
            }
        }
    })
];


