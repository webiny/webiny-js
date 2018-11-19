// @flow
import { categoryFactory } from "./Category.entity";
import { menuFactory } from "./Menu.entity";
import { pageFactory } from "./Page.entity";
import { tagFactory } from "./Tag.entity";
import { tags2pagesFactory } from "./Tags2Pages.entity";
import { elementFactory } from "./Element.entity";

export default ({ user }: Object) => {
    let entities = {};

    entities.Category = categoryFactory();
    entities.Page = pageFactory({ user, entities });
    entities.Menu = menuFactory();
    entities.Tag = tagFactory();
    entities.Tags2Pages = tags2pagesFactory({ user, entities });
    entities.Element = elementFactory();

    return entities;
};
