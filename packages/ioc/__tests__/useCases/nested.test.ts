// export default withFields({
//     name: string({ validation: "required,maxLength:500" }),
//     websiteUrl: onSet(trimTrailingSlashes)(string({ validation: "url,maxLength:500" })),
//     websitePreviewUrl: onSet(trimTrailingSlashes)(string({ validation: "url,maxLength:500" })),
//     favicon: object({}),
//     logo: object({}),
//     social: fields({
//         value: {},
//         instanceOf: withFields({
//             facebook: string({ validation: "url,maxLength:500" }),
//             twitter: string({ validation: "url,maxLength:500" }),
//             instagram: string({ validation: "url,maxLength:500" }),
//             image: object({})
//         })()
//     }),
//     htmlTags: fields({
//         value: {},
//         instanceOf: withFields({
//             header: string(),
//             footer: string()
//         })()
//     }),
//     pages: fields({
//         value: {},
//         instanceOf: withFields({
//             home: onSet(extractPid)(string()),
//             notFound: onSet(extractPid)(string())
//         })()
//     }),
//     // TODO: implement this via a plugin when https://github.com/webiny/webiny-js/issues/2168 is resolved.
//     theme: string()
// })();

jest.retryTimes(0);

const trimTrailingSlashes = (value: string): string => value.replace(/\/$/, "");

const extractPid = (value: string): string | null => {
    const [pid] = value.split("#");
    return pid || null;
};

type RawData = Record<string, any>;

function ownAndInheritedPropertyNames(obj: DataModel) {
    const names: string[] = [];
    while (obj) {
        const descriptors = Object.getOwnPropertyDescriptors(obj);
        Object.keys(descriptors).forEach(name => {
            if (descriptors[name].get && descriptors[name].set && name !== "__proto__") {
                names.push(name);
            }
        });
        obj = Object.getPrototypeOf(obj);
    }
    return names;
}

class DataModel {
    protected _data: Record<string, any> = {};

    toDTO(): Record<string, any> {
        const names = ownAndInheritedPropertyNames(this);

        return names.reduce<Record<string, any>>((acc, key) => {
            const value = this[key as keyof this];
            if (value instanceof DataModel) {
                return {
                    ...acc,
                    [key]: value.toDTO()
                };
            }
            return { ...acc, [key]: value };
        }, {});
    }

    populate(data: RawData) {
        Object.keys(data).forEach(key => {
            this[key as keyof this] = data[key];
        });
    }
}

class SettingsModel extends DataModel {
    get name() {
        return this._data.name || "Default name";
    }

    set name(value) {
        this._data.name = value;
    }

    get websiteUrl() {
        return this._data.websiteUrl;
    }

    set websiteUrl(value) {
        this._data.websiteUrl = trimTrailingSlashes(value);
    }

    get social(): SocialSettingsModel {
        return this._data.social;
    }

    set social(value: RawData | SocialSettingsModel) {
        if (value instanceof SocialSettingsModel) {
            this._data.social = value;
            return;
        }

        const social = new SocialSettingsModel();
        social.populate(value);
        this._data.social = social;
    }

    get pages(): SettingsPagesModel {
        return this._data.pages;
    }

    set pages(value: RawData | SettingsPagesModel) {
        if (value instanceof SettingsPagesModel) {
            this._data.pages = value;
            return;
        }

        const pages = new SettingsPagesModel();
        pages.populate(value);
        this._data.pages = pages;
    }
}

class SocialSettingsModel extends DataModel {
    get facebook() {
        return this._data.facebook;
    }

    set facebook(value) {
        this._data.facebook = value;
    }
}

class SettingsPagesModel extends DataModel {
    get home() {
        return this._data.home;
    }

    set home(value) {
        this._data.home = extractPid(value);
    }

    get notFound() {
        return this._data.notFound;
    }

    set notFound(value) {
        this._data.notFound = extractPid(value);
    }
}

describe("Nested models", () => {
    it("should support nested models using raw values", () => {
        const settings = new SettingsModel();
        settings.populate({
            websiteUrl: "https://www.domain.com/",
            pages: {
                home: "12345678#00001",
                notFound: "87654321#00003"
            },
            social: {
                facebook: "https://fb.com/me"
            }
        });

        expect(settings.toDTO()).toEqual({
            name: "Default name",
            // This value should not have the trailing slash
            websiteUrl: "https://www.domain.com",
            pages: {
                home: "12345678",
                notFound: "87654321"
            },
            social: {
                facebook: "https://fb.com/me"
            }
        });
    });

    it("should support model instances assignment", () => {
        const settings = new SettingsModel();
        settings.populate({
            name: "Test",
            websiteUrl: "https://www.domain.com/",
            social: {
                facebook: "https://fb.com/me"
            }
        });

        expect(settings.toDTO()).toEqual({
            name: "Test",
            // This value should not have the trailing slash
            websiteUrl: "https://www.domain.com",
            social: {
                facebook: "https://fb.com/me"
            }
        });

        const social = new SocialSettingsModel();
        social.facebook = "https://meta.com/me";
        settings.social = social;

        expect(settings.toDTO()).toEqual({
            name: "Test",
            // This value should not have the trailing slash
            websiteUrl: "https://www.domain.com",
            social: {
                facebook: "https://meta.com/me"
            }
        });

        expect(settings.social).toBeInstanceOf(SocialSettingsModel);
        expect(settings.social.facebook).toEqual("https://meta.com/me");
    });

    it("should support custom methods", () => {
        class CustomSettingsModel extends SettingsModel {
            override get name(): string {
                return super.name;
            }

            override set name(value: string) {
                super.name = `${value} (custom)`;
            }

            isCustomDomainSet() {
                return !this.websiteUrl.includes("domain.com");
            }
        }

        const settings = new CustomSettingsModel();
        settings.populate({
            name: "Test",
            websiteUrl: "https://www.domain.com/",
            social: {
                facebook: "https://fb.com/me"
            }
        });

        expect(settings.toDTO()).toEqual({
            name: "Test (custom)",
            // This value should not have the trailing slash
            websiteUrl: "https://www.domain.com",
            social: {
                facebook: "https://fb.com/me"
            }
        });

        expect(settings.isCustomDomainSet()).toEqual(false);
        settings.websiteUrl = "https://www.webiny.com";
        expect(settings.isCustomDomainSet()).toEqual(true);
    });
});
