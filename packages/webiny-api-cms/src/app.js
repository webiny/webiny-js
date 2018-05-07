// @flow
import Page from "./entities/page.entity";
import Layout from "./entities/layout.entity";
import Revision from "./entities/revision.entity";
import Category from "./entities/category.entity";
import Widget from "./entities/widget.entity";
import addPageQueries from "./queries/page";

export default () => {
    return ({ app }: Object, next: Function) => {
        app.graphql.schema(schema => {
            schema.addEntity(Page);
            schema.addEntity(Layout);
            schema.addEntity(Category);
            schema.addEntity(Revision);
            schema.addEntity(Widget);

            addPageQueries(schema);
        });

        next();
    };
};
