import { getBaseConfiguration } from "@webiny/api-opensearch";
import type { OpenSearchIndexRequestBody } from "@webiny/api-opensearch/types.js";
import { CmsEntryOpenSearchIndex } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchIndex";
import { createImplementation } from "@webiny/feature/api";

class CustomOpenSearchIndexImpl implements CmsEntryOpenSearchIndex.Interface {
    public readonly body: OpenSearchIndexRequestBody;

    public constructor() {
        this.body = getBaseConfiguration(body => {
            return {
                ...body,
                mappings: {
                    ...body.mappings,
                    dynamic_templates: (body.mappings?.dynamic_templates || [])
                        .map(template => {
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

export const CustomOpenSearchIndex = createImplementation({
    abstraction: CmsEntryOpenSearchIndex,
    implementation: CustomOpenSearchIndexImpl,
    dependencies: []
});
