var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { flow } from "lodash";
import { withStaticProps, withName, string, boolean, fields, withFields, setOnce, onSet } from "@webiny/commodo";
import { validation } from "@webiny/validation";
const SETTINGS_KEY = "file-manager";
export default ({ createBase }) => {
    const FilesSettings = flow(withName("Settings"), withStaticProps({
        load() {
            return __awaiter(this, void 0, void 0, function* () {
                let settings = yield this.findOne({ query: { key: SETTINGS_KEY } });
                if (!settings) {
                    // TODO: fix TS
                    // @ts-ignore
                    settings = new FilesSettings();
                    yield settings.save();
                }
                return settings;
            });
        }
    }), withFields({
        key: setOnce()(string({ value: SETTINGS_KEY })),
        data: fields({
            value: {},
            instanceOf: withFields({
                installed: boolean({ value: false }),
                srcPrefix: onSet(value => {
                    // Make sure srcPrefix always ends with forward slash.
                    if (typeof value === "string") {
                        return value.endsWith("/") ? value : value + "/";
                    }
                    return value;
                })(string({
                    validation: validation.create("required"),
                    value: "/files/"
                }))
            })()
        })
    }))(createBase());
    return FilesSettings;
};
