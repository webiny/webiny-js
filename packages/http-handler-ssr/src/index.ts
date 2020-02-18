import ssrCacheApi from "./ssrCacheApi";
import ssrServe from "./ssrServe";
import models from "./models";
import { withFields, boolean, number, string, fields } from "@webiny/commodo/fields";

const Animal = withFields({
    name: string({
        validate: value => {
            if (!value) {
                throw Error("A pet must have a name!");
            }
        }
    }),
    age: number(),
    isAwesome: boolean(),
    about: fields({
        value: {},
        instanceOf: withFields({
            type: string({ value: "cat" }),
            dangerous: boolean({ value: true })
        })()
    })
})();

const animal = new Animal();
animal.populate({ age: "7" }); // Throws data type error, cannot populate a string with number.

animal.populate({ age: 7 });
await animal.validate(); // Throws a validation error - name must be defined.

animal.name = "Garfield";
await animal.validate(); // All good.

export default rawOptions => {
    const options = new OptionsModel().populate(rawOptions);
    const plugins = [models(options), ssrServe(options)];
    if (options.cache.enabled) {
        plugins.push(ssrCacheApi());
    }
    return plugins;
};
