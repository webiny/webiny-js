import { getBaseConfiguration } from "@webiny/api-elasticsearch";
import { CmsEntryElasticsearchIndexPlugin } from "~/plugins/CmsEntryElasticsearchIndexPlugin";

export const createIndexConfigurationPlugin = () => {
    return new CmsEntryElasticsearchIndexPlugin({
        body: getBaseConfiguration(body => {
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
        })
    });
};
