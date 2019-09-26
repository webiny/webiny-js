// @flow
export const getOptionValue = (option: any, props: Object) => {
    if (option) {
        return props.useSimpleValues ? option : option[props.valueProp];
    }

    return option;
};

export const getOptionText = (option: any, props: Object) => {
    if (option) {
        return props.useSimpleValues ? option : option[props.textProp];
    }

    return option;
};
