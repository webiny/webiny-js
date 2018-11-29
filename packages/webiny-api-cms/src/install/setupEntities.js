// @flow
import { categoryFactory } from "./../entities/Category.entity";
import { menuFactory } from "./../entities/Menu.entity";
import { pageFactory } from "./../entities/Page.entity";
import { tagFactory } from "./../entities/Tag.entity";
import { tags2PagesFactory } from "./../entities/Tags2Pages.entity";
import { elementFactory } from "./../entities/Element.entity";

export default ({ user }: Object) => {
    let entities = {};

    entities.Category = categoryFactory();
    entities.Tag = tagFactory({ entities });
    entities.Tags2Pages = tags2PagesFactory({ user, entities });
    entities.Page = pageFactory({ user, entities });
    entities.Menu = menuFactory();
    entities.Element = elementFactory();

    return entities;
};
