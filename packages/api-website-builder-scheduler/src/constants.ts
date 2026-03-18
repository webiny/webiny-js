export const WEBSITE_BUILDER_NAMESPACE = "WebsiteBuilder/Type/";

export const SCHEDULED_ACTION_TYPE_PAGE = "page" as const ;
export const SCHEDULED_ACTION_TYPE_REDIRECT = "redirect" as const;

export const SCHEDULED_ACTION_TYPES = [SCHEDULED_ACTION_TYPE_PAGE, SCHEDULED_ACTION_TYPE_REDIRECT] as const;
