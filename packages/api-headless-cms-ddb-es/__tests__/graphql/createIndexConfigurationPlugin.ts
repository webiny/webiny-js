import { createRegisterExtensionPlugin } from "@webiny/handler";
import { CmsModelOpenSearchIndex } from "~/features/CmsModelOpenSearchIndex/index.js";

class CustomOpenSearchIndex implements CmsModelOpenSearchIndex.Interface {
    constructor(private original: CmsModelOpenSearchIndex.Interface) {}

    async execute(params: CmsModelOpenSearchIndex.Params): Promise<CmsModelOpenSearchIndex.Result> {
        const result = await this.original.execute(params);
        const settings = result.settings;

        return {
            ...result,
            settings: {
                ...settings,
                mappings: {
                    ...settings.mappings,
                    dynamic_templates: (settings.mappings?.dynamic_templates || [])
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
                                                    type: "keyword" as const,
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
                                        type: "byte" as const
                                    }
                                }
                            }
                        ])
                }
            }
        };
    }
}

export const createIndexConfigurationPlugin = () => {
    return createRegisterExtensionPlugin(({ container }) => {
        container.registerDecorator(
            CmsModelOpenSearchIndex.createDecorator({
                decorator: CustomOpenSearchIndex,
                dependencies: []
            })
        );
    });
};
