export const getFormId = form => {
    if (form.id.includes("#")) {
        return `${form.id.split("#")[0]}#${form.version}`;
    }
    return `${form.id}#${form.version}`;
};

export const getBaseFormId = id => {
    return id.split("#")[0];
};

export const getStatus = ({ published, locked }: { published: boolean; locked: boolean }) => {
    if (published) {
        return "published";
    }

    return locked ? "locked" : "draft";
};

export const hasRwd = ({ formBuilderFormPermission, rwd }) => {
    if (typeof formBuilderFormPermission.rwd !== "string") {
        return true;
    }

    return formBuilderFormPermission.rwd.includes(rwd);
};