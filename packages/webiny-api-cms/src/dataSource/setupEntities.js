// @flow
import { categoryFactory } from "../entities/Category.entity";
import { pageFactory } from "../entities/Page.entity";
import { revisionFactory } from "../entities/Revision.entity";

export default ({ user }: Object) => {
    let entities = {};

    entities.Category = categoryFactory({ user, entities });
    entities.Page = pageFactory({ user, entities });
    entities.Revision = revisionFactory({ user, entities });

    return entities;
};