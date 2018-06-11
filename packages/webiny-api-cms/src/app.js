// @flow
import Page from "./entities/Page.entity";
import Revision from "./entities/Revision.entity";
import Category from "./entities/Category.entity";
import Widget from "./entities/Widget.entity";
import WidgetPreset from "./entities/WidgetPreset.entity";
import addPageQueries from "./queries/page";

export default () => {
    return {
        init({ app }: Object, next: Function) {
            app.graphql.schema(schema => {
                schema.addEntity(Page);
                schema.addEntity(Category);
                schema.addEntity(Revision);
                schema.addEntity(Widget);
                schema.addEntity(WidgetPreset);

                addPageQueries(schema);
            });

            app.entities.addEntityClass(Page);
            app.entities.addEntityClass(Category);
            app.entities.addEntityClass(Revision);
            app.entities.addEntityClass(Widget);
            app.entities.addEntityClass(WidgetPreset);

            next();
        },
        async install(params: {}, next: Function) {
            const { default: install } = await import("./install");
            await install();

            next();
        }
    };
};
