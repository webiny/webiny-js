// @flow
import Page from "./entities/Page.entity";
import Revision from "./entities/Revision.entity";
import Category from "./entities/Category.entity";
import Widget from "./entities/Widget.entity";
import WidgetPreset from "./entities/WidgetPreset.entity";
import addPageQueries from "./queries/page";

export default () => {
    return {
        async install(params: {}, next: Function) {
            const { default: install } = await import("./install");
            await install();

            next();
        },

        init({ api }: Object, next: Function) {
            api.graphql.schema(schema => {
                schema.registerEntity(Page);
                schema.registerEntity(Category);
                schema.registerEntity(Revision);
                schema.registerEntity(Widget);
                schema.registerEntity(WidgetPreset);

                addPageQueries(schema);
            });

            api.entities.registerEntity(Page);
            api.entities.registerEntity(Category);
            api.entities.registerEntity(Revision);
            api.entities.registerEntity(Widget);
            api.entities.registerEntity(WidgetPreset);

            next();
        }
    };
};
