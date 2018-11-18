// @flow
export const getOptionValue = (option: any, props: Object) => {
    return props.useSimpleValue ? option : option[props.valueProp];
};

export const getOptionText = (option: any, props: Object) => {
    return props.useSimpleValue ? option : option[props.textProp];
};
