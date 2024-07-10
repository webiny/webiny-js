import { useHandler } from "~tests/testHelpers/useHandler";
import { CmsModelPlugin } from "~/plugins";
import { pageModel } from "./mocks/page.model";
import { pageEntry } from "./mocks/page.entry";

describe("Content Traverser", () => {
    it("should traverse model AST and build flat object with entry values", async () => {
        const { handler, tenant } = useHandler({
            plugins: [new CmsModelPlugin(pageModel)]
        });

        const context = await handler({
            path: "/cms/manage/en-US",
            headers: {
                "x-webiny-cms-endpoint": "manage",
                "x-webiny-cms-locale": "en-US",
                "x-tenant": tenant.id
            }
        });

        const traverser = await context.cms.getEntryTraverser("page");

        const output: Record<string, any> = {};

        const skipFieldTypes = ["object", "dynamicZone"];

        await traverser.traverse(pageEntry.values, ({ field, value, path }) => {
            /**
             * Most of the time you won't care about complex fields like "object" and "dynamicZone", but only their child fields.
             * The traverser will still go into the child fields, but this way you can control which fields you want to process.
             */
            if (skipFieldTypes.includes(field.type)) {
                return;
            }

            output[path] = value;
        });

        expect(output).toEqual({
            pageTitle: "From the Playground",
            pageType: "BasicPageTemplate",
            "pageSettings.generalPageSettings.pageSlug": "from-the-playground",
            "pageSettings.generalPageSettings.deliveryDomain": "acme.com",
            "pageSettings.generalPageSettings.layout": "dark",
            "pageSettings.generalPageSettings.pageClass": null,
            "pageSettings.generalPageSettings.pageCategory": null,
            "pageSettings.generalPageSettings.redirectUrl": null,
            "pageSettings.generalPageSettings.browserTabTitle": "John was here",
            "pageSettings.generalPageSettings.description": "the description",
            "pageSettings.generalPageSettings.customCanonicalUrl": null,
            "pageSettings.generalPageSettings.contentOwner": "ulf@acme.com",
            "pageSettings.generalPageSettings.organisation": "acme",
            "pageSettings.generalPageSettings.navTitle": null,
            "pageSettings.generalPageSettings.hideInNavigation": false,
            "pageSettings.generalPageSettings.hideInBreadcrumb": false,
            "pageSettings.generalPageSettings.noFollow": "inherited",
            "pageSettings.generalPageSettings.noIndex": "inherited",
            "pageSettings.generalPageSettings.publishTime": null,
            "pageSettings.generalPageSettings.unPublishTime": null,
            "pageSettings.generalPageSettings.headerContactLink": null,
            "pageSettings.generalPageSettings.copyRightText": null,
            "pageSettings.generalPageSettings.inheritFooterLinks": null,
            "pageSettings.generalPageSettings.inheritSocialMediaLinks": null,
            "pageSettings.generalPageSettings.uuid": "acme:Ma3wHp4Vb1n",
            "pageSettings.pageTeaserSettings.pageTeaserMedia.file": null,
            "pageSettings.pageTeaserSettings.pageTeaserMedia.altText": null,
            "pageSettings.pageTeaserSettings.pageTeaserMedia.seoName": null,
            "pageSettings.pageTeaserSettings.pageTeaserMedia.crop": null,
            "pageSettings.pageTeaserSettings.pageTeaserTitle": null,
            "pageSettings.pageTeaserSettings.pageTeaserText": "",
            "pageSettings.pageTeaserSettings.pageTeaserSocialMediaTitle": null,
            "pageSettings.pageTeaserSettings.pageTeaserSocialMediaText": "",
            "pageSettings.pageTeaserSettings.pageTeaserFakePublishDate": null,
            "pageSettings.pageTeaserSettings.pageTeaserExpiryDate": null,
            "pageSettings.pageTeaserSettings.pageTeaserFilterTags": null,
            "pageSettings.pageTeaserSettings.pageTeaserVisualTag1": null,
            "pageSettings.pageTeaserSettings.pageTeaserVisualTag2": null,
            "pageSettings.pageTeaserSettings.pageTeaserEventLocation": null,
            "pageSettings.pageTeaserSettings.pageTeaserEventStartDate": null,
            "pageSettings.pageTeaserSettings.pageTeaserEventEndDate": null,
            "pageTemplate.introZone.0.layout": "imageLeft",
            "pageTemplate.introZone.0.title.title": "my playground",
            "pageTemplate.introZone.0.title.headingRank": null,
            "pageTemplate.introZone.0.stageText": {
                root: {
                    format: null,
                    type: "root",
                    children: [
                        {
                            children: [
                                {
                                    mode: "normal",
                                    format: 0,
                                    style: null,
                                    detail: 0,
                                    text: "Hello Here is some text",
                                    type: "text",
                                    version: 1
                                }
                            ],
                            indent: 0,
                            format: null,
                            styles: [
                                {
                                    type: "typography",
                                    styleId: "paragraph1"
                                }
                            ],
                            type: "paragraph-element",
                            version: 1,
                            direction: "ltr"
                        }
                    ],
                    indent: 0,
                    version: 1,
                    direction: "ltr"
                }
            },
            "pageTemplate.introZone.0.button.buttonText": "Click me",
            "pageTemplate.introZone.0.button.linkpicker": "https://www.acme.com",
            "pageTemplate.introZone.0.stageMedia.file":
                "https://acme.com/assets/api/uuid:52e1aa7b-9f0d-4437-80e8-910e7a34e2b6/width:1036/image_small.jpeg",
            "pageTemplate.introZone.0.stageMedia.altText": "Heat map of the world",
            "pageTemplate.introZone.0.stageMedia.seoName": "seo name",
            "pageTemplate.introZone.0.stageMedia.crop": "0.1248:0:0.7503:1",
            "pageTemplate.introZone.0.uuid": "acme:playGroundXYZ",
            "pageTemplate.mainZone.0.title.title": "my Quote",
            "pageTemplate.mainZone.0.title.headingRank": null,
            "pageTemplate.mainZone.0.layout": "imageRight",
            "pageTemplate.mainZone.0.focusOn": "image",
            "pageTemplate.mainZone.0.quoteMedia.file":
                "https://acme.com/assets/api/uuid:4ae336d1-19c3-4ac4-b755-0cc25644eac4/no-text_original.png",
            "pageTemplate.mainZone.0.quoteMedia.altText": "alt",
            "pageTemplate.mainZone.0.quoteMedia.seoName": "seo-name",
            "pageTemplate.mainZone.0.quoteText": "so what",
            "pageTemplate.mainZone.0.quoteSource": "John",
            "pageTemplate.mainZone.0.uuid": "acme:098MyQuote77",
            "pageTemplate.mainZone.1.layout": "imageRight",
            "pageTemplate.mainZone.1.uuid": "acme:ttJcRRPR0JP",
            "pageTemplate.mainZone.1.title.title": "my MRT",
            "pageTemplate.mainZone.1.title.headingRank": "h3",
            "pageTemplate.mainZone.1.subtitle": "The MRT subtitle",
            "pageTemplate.mainZone.1.text": {
                root: {
                    format: null,
                    type: "root",
                    children: [
                        {
                            children: [
                                {
                                    mode: "normal",
                                    format: 0,
                                    style: null,
                                    detail: 0,
                                    text: "some nice words",
                                    type: "text",
                                    version: 1
                                }
                            ],
                            indent: 0,
                            format: null,
                            styles: [
                                {
                                    type: "typography",
                                    styleId: "paragraph1"
                                }
                            ],
                            type: "paragraph-element",
                            version: 1,
                            direction: "ltr"
                        }
                    ],
                    indent: 0,
                    version: 1,
                    direction: "ltr"
                }
            },
            "pageTemplate.mainZone.1.mrtMedia.0.file":
                "https://acme.com/assets/api/uuid:4ae336d1-19c3-4ac4-b755-0cc25644eac4/sf-no-text_original.png",
            "pageTemplate.mainZone.1.mrtMedia.0.altText": "alternative text",
            "pageTemplate.mainZone.1.mrtMedia.0.seoName": "seo-optimized-name",
            "pageTemplate.mainZone.1.mrtMedia.0.caption": "Hä? ",
            "pageTemplate.mainZone.1.mrtMedia.0.captionLink": "caption Link ",
            "pageTemplate.mainZone.1.mrtMedia.1.file":
                "https://acme.com/assets/api/uuid:b3bddd2b-553a-483a-8bc1-20f02471ed1e/vegas-toureiffel_original.mp4",
            "pageTemplate.mainZone.1.mrtMedia.1.altText": null,
            "pageTemplate.mainZone.1.mrtMedia.1.caption": null,
            "pageTemplate.mainZone.1.mrtMedia.1.captionLink": null,
            "pageTemplate.mainZone.1.mrtMedia.1.seoName": null,
            "pageTemplate.mainZone.1.button.buttonText": "Click me",
            "pageTemplate.mainZone.1.button.linkpicker": "https://www.acme.com",
            "pageTemplate.mainZone.1.linklist.0.text": "my first link ",
            "pageTemplate.mainZone.1.linklist.0.linkpicker": "http://www.domain.com",
            "pageTemplate.mainZone.2.layout": null,
            "pageTemplate.mainZone.2.title.title": "CTR title",
            "pageTemplate.mainZone.2.title.headingRank": null,
            "pageTemplate.mainZone.2.contentTeaserRowCards.0.contentTeaserRowMediaMedia.file":
                "https://acme.com/assets/api/uuid:fca831bb-373a-4b2c-91d3-c3284f16b613/width:1036/image_small.png",
            "pageTemplate.mainZone.2.contentTeaserRowCards.0.contentTeaserRowMediaMedia.altText":
                "asd",
            "pageTemplate.mainZone.2.contentTeaserRowCards.0.contentTeaserRowMediaMedia.seoName":
                "wdfb",
            "pageTemplate.mainZone.2.contentTeaserRowCards.0.title.title": "inner teaser title",
            "pageTemplate.mainZone.2.contentTeaserRowCards.0.title.headingRank": "h3",
            "pageTemplate.mainZone.2.contentTeaserRowCards.0.text": {
                root: {
                    format: null,
                    type: "root",
                    children: [
                        {
                            children: [
                                {
                                    mode: "normal",
                                    format: 0,
                                    style: null,
                                    detail: 0,
                                    text: "with som etext ",
                                    type: "text",
                                    version: 1
                                }
                            ],
                            indent: 0,
                            format: null,
                            styles: [
                                {
                                    type: "typography",
                                    styleId: "paragraph1"
                                }
                            ],
                            type: "paragraph-element",
                            version: 1,
                            direction: "ltr"
                        }
                    ],
                    indent: 0,
                    version: 1,
                    direction: "ltr"
                }
            },
            "pageTemplate.mainZone.2.contentTeaserRowCards.0.uuid": "acme:hmAHkQsvr5q",
            "pageTemplate.mainZone.2.uuid": "acme:LyEFKwkutww"
        });
    });
});
