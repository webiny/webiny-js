import { ElasticsearchIndexRequestBody } from "~/types";
import { dynamicTemplateDates } from "./common";

export const japanese: ElasticsearchIndexRequestBody = {
    settings: {
        index: {
            analysis: {
                char_filter: {
                    normalize: {
                        type: "icu_normalizer",
                        name: "nfkc",
                        mode: "compose"
                    }
                },
                tokenizer: {
                    ja_kuromoji_tokenizer: {
                        mode: "search",
                        type: "kuromoji_tokenizer",
                        discard_compound_token: "true",
                        user_dictionary_rules: [
                            "東京スカイツリー,東京 スカイツリー,トウキョウ スカイツリー,カスタム名詞"
                        ]
                    },
                    ja_ngram_tokenizer: {
                        type: "ngram",
                        min_gram: "2",
                        max_gram: "2",
                        token_chars: ["letter", "digit"]
                    }
                },
                filter: {
                    ja_index_synonym: {
                        type: "synonym",
                        lenient: "false",
                        synonyms: []
                    },
                    ja_search_synonym: {
                        type: "synonym_graph",
                        lenient: "false",
                        synonyms: ["米国, アメリカ", "東京大学, 東大"]
                    }
                },
                analyzer: {
                    ja_kuromoji_index_analyzer: {
                        type: "custom",
                        char_filter: ["normalize"],
                        tokenizer: "ja_kuromoji_tokenizer",
                        filter: [
                            "kuromoji_baseform",
                            "kuromoji_part_of_speech",
                            "ja_index_synonym",
                            "cjk_width",
                            "ja_stop",
                            "kuromoji_stemmer",
                            "lowercase"
                        ]
                    },
                    ja_kuromoji_search_analyzer: {
                        type: "custom",
                        char_filter: ["normalize"],
                        tokenizer: "ja_kuromoji_tokenizer",
                        filter: [
                            "kuromoji_baseform",
                            "kuromoji_part_of_speech",
                            "ja_search_synonym",
                            "cjk_width",
                            "ja_stop",
                            "kuromoji_stemmer",
                            "lowercase"
                        ]
                    },
                    ja_ngram_index_analyzer: {
                        type: "custom",
                        char_filter: ["normalize"],
                        tokenizer: "ja_ngram_tokenizer",
                        filter: ["lowercase"]
                    },
                    ja_ngram_search_analyzer: {
                        type: "custom",
                        char_filter: ["normalize"],
                        tokenizer: "ja_ngram_tokenizer",
                        filter: ["ja_search_synonym", "lowercase"]
                    }
                },
                default: {
                    type: "ja_kuromoji_index_analyzer"
                },
                default_search: {
                    type: "ja_kuromoji_search_analyzer"
                }
            }
        }
    },
    mappings: {
        dynamic_templates: dynamicTemplateDates.concat([
            {
                strings: {
                    match_mapping_type: "string",
                    mapping: {
                        type: "text",
                        search_analyzer: "ja_kuromoji_search_analyzer",
                        analyzer: "ja_kuromoji_index_analyzer",
                        fields: {
                            ngram: {
                                type: "text",
                                search_analyzer: "ja_ngram_search_analyzer",
                                analyzer: "ja_ngram_index_analyzer"
                            },
                            keyword: {
                                ignore_above: 256,
                                type: "keyword"
                            }
                        }
                    }
                }
            }
        ]),
        properties: {
            rawValues: {
                type: "object",
                enabled: false
            }
        }
    }
};
