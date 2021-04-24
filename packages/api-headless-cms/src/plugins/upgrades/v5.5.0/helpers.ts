type BasicPermission = { name: string; [key: string]: any };

export const isCmsContentPermission = (permission: BasicPermission) =>
    permission.name.includes("cms.") && !permission.name.includes("cms.endpoint.");
