// @flow
import { categoryFactory } from "../entities/Category.entity";
import { pageFactory } from "../entities/Page.entity";
import { elementFactory } from "../entities/Element.entity";

export default ({ user }: Object) => {
    let entities = {};

    entities.Category = categoryFactory();
    entities.Page = pageFactory({ user, entities });
    entities.Element = elementFactory();

    return entities;
};
