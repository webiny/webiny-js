// @flow
export const getOptionValue = (option: any, props: Object) => {
    return props.simpleValues ? option : option[props.valueProp];
};

export const getOptionText = (option: any, props: Object) => {
    return props.simpleValues ? option : option[props.textProp];
};
