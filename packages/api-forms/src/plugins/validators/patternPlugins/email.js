export default {
    type: "form-field-validator-pattern",
    name: "form-field-validator-pattern-email",
    pattern: {
        name: "email",
        regex: `^\\w[\\w.-]*@([\\w-]+\\.)+[\\w-]+$`,
        flags: "i",
    }
};
