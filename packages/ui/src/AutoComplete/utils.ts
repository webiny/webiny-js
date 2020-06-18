type Props = {
    useSimpleValues?: boolean;
    valueProp?: string;
    textProp?: string;
};

export const getOptionValue = (option: any, props: Props) => {
    if (option) {
        return props.useSimpleValues ? option : option[props.valueProp];
    }

    return option;
};

export const getOptionText = (option: any, props: Props) => {
    if (option) {
        return props.useSimpleValues ? option : option[props.textProp];
    }

    return option;
};

export const findInAlias = (option: any, search?: string) => {
    if (option && option.aliases) {
        return option.aliases.some(alias =>
            alias.toLowerCase().includes(search.toLowerCase())
        );
    }
}