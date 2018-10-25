// @flow
import { categoryFactory } from "../entities/Category.entity";
import { pageFactory } from "../entities/Page.entity";
import { revisionFactory } from "../entities/Revision.entity";
import { menuFactory } from "../entities/Menu.entity";

export default ({ user }: Object) => {
    let entities = {};

    entities.Category = categoryFactory({ user, entities });
    entities.Page = pageFactory({ user, entities });
    entities.Revision = revisionFactory({ user, entities });
    entities.Menu = menuFactory({ user, entities });

    return entities;
};
