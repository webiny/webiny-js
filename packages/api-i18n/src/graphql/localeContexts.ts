import { I18NLocaleContextPlugin } from "~/plugins/I18NLocaleContextPlugin";

export default [
    new I18NLocaleContextPlugin({
        context: {
            name: "default"
        }
    }),
    new I18NLocaleContextPlugin({
        context: {
            name: "content"
        }
    })
];
