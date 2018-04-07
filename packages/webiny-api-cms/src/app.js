// @flow
import Page from "./entities/page.entity";
import Category from "./entities/category.entity";
import Revision from "./entities/revision.entity";

export default () => {
    return ({ app }: Object, next: Function) => {
        app.graphql.schema(schema => {
            schema.crud(Page);
            schema.crud(Category);
            schema.crud(Revision);
        });

        next();
    };
};
