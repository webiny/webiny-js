export const createMappingsSnapshot = () => {
    return {
        mappings: {
            dynamic_templates: [
                {
                    ids: {
                        match: "^id|entryId$",
                        mapping: {
                            type: "string",
                            keyword: true
                        }
                    }
                },
                {
                    dates: {
                        match: "^createdOn|savedOn|publishedOn$",
                        mapping: {
                            type: "date"
                        }
                    }
                },
                {
                    numbers: {
                        match: "number@*",
                        mapping: {
                            fields: {
                                keyword: {
                                    ignore_above: 256,
                                    type: "keyword"
                                }
                            },
                            scaling_factor: 10000,
                            type: "scaled_float"
                        }
                    }
                },
                {
                    booleans: {
                        match: "boolean@*",
                        mapping: {
                            type: "boolean"
                        }
                    }
                },
                {
                    strings: {
                        match_mapping_type: "string",
                        mapping: {
                            fields: {
                                keyword: {
                                    ignore_above: 256,
                                    type: "keyword"
                                }
                            },
                            type: "text"
                        }
                    }
                },
                {
                    bytes: {
                        match: "byte@*",
                        mapping: {
                            type: "byte"
                        }
                    }
                }
            ],
            properties: {
                rawValues: {
                    type: "object",
                    enabled: false
                }
            }
        }
    };
};
