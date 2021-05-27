export interface KeyParserResult {
    attr: string;
    operation: string;
}

export interface Condition {
    key: string;
    negate?: boolean;
    validate?: (args: { value: any; attr: string }) => void;
}

interface WhereParserResultItem {
    attr: string;
    operation: string;
    value: any;
}

export interface WhereParserResult {
    AND?: WhereParserResultItem[] | WhereParserResult[];
    OR?: WhereParserResultItem[] | WhereParserResult[];
}
