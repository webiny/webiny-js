import menus from "./crud/menus.crud";
import categories from "./crud/categories.crud";
import pages from "./crud/pages.crud";
import pageElements from "./crud/pageElements.crud";
import settings from "./crud/settings.crud";
import { HandlerConfiguration } from "./types";

export default (configuration: HandlerConfiguration) => [
    menus,
    categories,
    pages(configuration),
    pageElements,
    settings
];
