interface Option {
    aliases?: string[];
    index?: number;
    name?: string;
    [key: string]: any;
}
interface Props {
    useSimpleValues?: boolean;
    valueProp?: string;
    textProp?: string;
}

export const getOptionValue = (option: Option | string, props: Props): string => {
    if (option) {
        return props.useSimpleValues
            ? (option as string)
            : (option as Option)[props.valueProp as string];
    }

    return option as string;
};

export const getOptionText = (option: Option | string, props: Props): string => {
    if (option) {
        return props.useSimpleValues
            ? (option as string)
            : (option as Option)[props.textProp as string];
    }

    return option as string;
};

export const findInAliases = (option: Option, search?: string): boolean => {
    return (option.aliases || []).some((alias: string): boolean => {
        return alias.toLowerCase().includes((search || "").toLowerCase());
    });
};
