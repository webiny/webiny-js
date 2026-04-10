import { getBaseConfiguration } from "@webiny/api-opensearch";
import type { OpenSearchIndexRequestBody } from "@webiny/api-opensearch/types.js";
import { CmsEntryOpenSearchIndex } from "~/features/CmsEntryOpenSearchIndex";
import { createRegisterExtensionPlugin } from "@webiny/handler";

class CustomOpenSearchIndex implements CmsEntryOpenSearchIndex.Interface {
    public readonly body: OpenSearchIndexRequestBody;

    public constructor() {
        this.body = getBaseConfiguration(body => {
            return {
                ...body,
                mappings: {
                    ...body.mappings,
                    dynamic_templates: (body.mappings.dynamic_templates || [])
                        .map(template => {
                            /**
                             * This part replaces the default numbers mapping with the one containing keyword field.
                             */
                            const numbers = template["numbers"];
                            if (numbers) {
                                return {
                                    ...template,
                                    numbers: {
                                        ...numbers,
                                        mapping: {
                                            ...numbers.mapping,
                                            fields: {
                                                keyword: {
                                                    type: "keyword",
                                                    ignore_above: 256
                                                }
                                            }
                                        }
                                    }
                                };
                            }
                            return template;
                        })
                        .concat([
                            {
                                bytes: {
                                    match: "byte@*",
                                    mapping: {
                                        type: "byte"
                                    }
                                }
                            }
                        ])
                }
            };
        });
    }

    public canUse(): boolean {
        return true;
    }
}

export const createIndexConfigurationPlugin = () => {
    return createRegisterExtensionPlugin(({ container }) => {
        container.register(
            CmsEntryOpenSearchIndex.createImplementation({
                implementation: CustomOpenSearchIndex,
                dependencies: []
            })
        );
    });
};
