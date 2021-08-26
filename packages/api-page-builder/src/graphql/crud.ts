import menus from "./crud/menus.crud";
import modifyMenuItems from "./crud/menus/modifyMenuItems";
import categories from "./crud/categories.crud";
import pages from "./crud/pages.crud";
import pageValidation from "./crud/pages.validation";
import pageElements from "./crud/pageElements.crud";
import settings from "./crud/settings.crud";
import system from "./crud/system.crud";

export default [
    menus,
    modifyMenuItems,
    categories,
    pages,
    pageValidation,
    pageElements,
    settings,
    system
];
