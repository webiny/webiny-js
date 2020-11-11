export const getFormId = form => {
    if (form.id.includes("#")) {
        return `${form.id.split("#")[0]}#${form.version}`;
    }
    return `${form.id}#${form.version}`;
};

export const getBaseFormId = id => {
    return id.split("#")[0];
};
