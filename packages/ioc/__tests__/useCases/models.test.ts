import { interfaces } from "inversify";
import { z } from "zod";
import { Container, createContainer } from "~/index";
type Constructor<T> = new (...args: never[]) => T;

abstract class DataModel {
    validate(): z.SafeParseReturnType<any, any> {
        return this.getValidationSchema().safeParse(this.toDTO());
    }
    abstract getValidationSchema(): z.ZodObject<any>;
    abstract populate(data: any): void;
    abstract toDTO(): any;
}

// Base Page model
class Page extends DataModel {
    // Page title
    title = "";

    populate(data: any) {
        this.title = data.title;
    }

    getValidationSchema(): z.ZodObject<any> {
        return z.object({
            title: z.string()
        });
    }

    toDTO() {
        return {
            title: this.title
        };
    }
}

const PageModelToken = "Page";

// Page model plugin
type PageModelModifier = <T extends Constructor<Page>>(page: Constructor<Page>) => T;

// Type of the custom page
type MyPage = Constructor<
    Page & {
        price: number;
        category: string;
        isFinancialArticle(): boolean;
    }
>;

describe("Extend model via DI container activation", () => {
    let container: Container;
    let createPageModelPlugin: (cb: PageModelModifier) => void;

    beforeEach(() => {
        container = createContainer();
        container.bind(PageModelToken).toConstructor(Page);

        createPageModelPlugin = (cb: PageModelModifier) => {
            container.onActivation<interfaces.Newable<Page>>(PageModelToken, (_, Dep) => {
                return cb(Dep);
            });
        };
    });

    it("should apply class extensions correctly", async () => {
        // @ts-expect-error for now
        createPageModelPlugin(Page => {
            return class MyPage extends Page {
                price = 0;

                override populate(data: any) {
                    super.populate(data);
                    this.price = data.price;
                }

                override toDTO() {
                    return {
                        ...super.toDTO(),
                        price: this.price
                    };
                }

                override getValidationSchema(): z.ZodObject<any> {
                    const schema = super.getValidationSchema();
                    return schema.extend({
                        price: z.number().gt(100)
                    });
                }
            };
        });

        // @ts-expect-error for now
        createPageModelPlugin(Page => {
            return class MyPage extends Page {
                category = "";

                override populate(data: any) {
                    super.populate(data);
                    this.category = data.category;
                }

                isFinancialArticle() {
                    return this.category === "financial";
                }

                override toDTO() {
                    return {
                        ...super.toDTO(),
                        category: this.category
                    };
                }
            };
        });

        // Simulate DI
        const PageModel = container.get<MyPage>(PageModelToken);

        // Use page model
        const page = new PageModel();
        page.populate({
            title: "My title",
            price: 50,
            category: "news",
            bogus: "prop"
        });

        const firstRun = page.validate();
        expect(firstRun.success).toBe(false);
        if (!firstRun.success) {
            expect(firstRun.error.issues[0].code).toEqual("too_small");
            expect(firstRun.error.issues[0].path[0]).toEqual("price");
        }

        page.price = 200;
        const secondRun = page.validate();
        expect(secondRun.success).toBe(true);

        // @ts-expect-error
        expect(page["bogus"]).toBeUndefined();
        expect(page.title).toEqual("My title");
        expect(page.price).toEqual(200);
        expect(page.category).toEqual("news");
        expect(page.isFinancialArticle()).toBe(false);
        page.category = "financial";
        expect(page.isFinancialArticle()).toBe(true);
        expect(page.toDTO()).toEqual({
            title: "My title",
            price: 200,
            category: "financial"
        });
    });
});
