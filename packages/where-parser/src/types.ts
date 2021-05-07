export interface KeyParserResult {
    attr: string;
    operation: string;
}

export interface Condition {
    key: string;
    negate?: boolean;
    validate?: (args: { value: any; attr: string }) => void;
}

export interface WhereParserResult {
    AND?: WhereParserResult;
    OR?: WhereParserResult;
}
