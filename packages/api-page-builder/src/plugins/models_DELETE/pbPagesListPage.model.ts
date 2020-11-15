import { flow } from "lodash";
import {
    withFields,
    string,
    number,
    boolean,
    date,
    withName,
    withProps,
    ref
} from "@webiny/commodo";

/**
 * A read-only model, used when listing pages. The most important thing here is that we don't load the content.
 * @param createBase
 * @param PbCategory
 * @param PbSettings
 */
export default ({ createBase, PbCategory, PbSettings }) => {
    const PbPagesListPage: any = flow(
        withName("PbPage"),
        withFields({
            category: ref({ instanceOf: PbCategory }),
            publishedOn: date(),
            title: string(),
            snippet: string(),
            url: string(),
            version: number(),
            parent: string(),
            published: boolean(),
            locked: boolean()
        }),
        withProps({
            get isHomePage() {
                return new Promise(async resolve => {
                    const settings = await PbSettings.load();
                    resolve(settings.data.pages.home === this.parent);
                }).catch(() => false);
            },
            get isErrorPage() {
                return new Promise(async resolve => {
                    const settings = await PbSettings.load();
                    resolve(settings.data.pages.error === this.parent);
                }).catch(() => false);
            },
            get isNotFoundPage() {
                return new Promise(async resolve => {
                    const settings = await PbSettings.load();
                    resolve(settings.data.pages.notFound === this.parent);
                }).catch(() => false);
            },
            get revisions() {
                return new Promise(async resolve => {
                    const revisions = await PbPagesListPage.find({
                        query: { parent: this.parent },
                        sort: { version: -1 }
                    });
                    resolve(revisions);
                });
            },
            get fullUrl() {
                return new Promise(async (resolve, reject) => {
                    try {
                        const settings = await PbSettings.load();
                        resolve(settings.data.domain.replace(/\/+$/g, "") + this.url);
                    } catch (e) {
                        reject(e);
                    }
                });
            }
        })
    )(createBase());

    return PbPagesListPage;
};
