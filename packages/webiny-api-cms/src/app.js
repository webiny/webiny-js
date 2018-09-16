// @flow
import { createCmsField } from "./graphql";

export default () => {
    return {
        async install(params: Object, next: Function) {
            const { default: install } = await import("./install");
            await install();

            next();
        },

        init(params: Object, next: Function) {
            createCmsField();

            next();
        }
    };
};
