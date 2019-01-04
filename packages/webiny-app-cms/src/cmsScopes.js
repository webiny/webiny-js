// @flow
export const SCOPES_MENUS = [
    "cms:menu:get",
    "cms:menu:list",
    "cms:menu:create",
    "cms:menu:update",
    "cms:menu:delete"
];

export const SCOPES_CATEGORIES = [
    "cms:category:get",
    "cms:category:list",
    "cms:category:create",
    "cms:category:update",
    "cms:category:delete"
];

export const SCOPES_TAGS = [
    "cms:tag:create",
    "cms:tag:get",
    "cms:tag:list",
    "cms:tag:update",
    "cms:tag:delete"
];

export const SCOPES_PAGES = [
    ...SCOPES_TAGS,
    "cms:page:get",
    "cms:page:list",
    "cms:page:create",
    "cms:page:update",
    "cms:page:delete"
];
