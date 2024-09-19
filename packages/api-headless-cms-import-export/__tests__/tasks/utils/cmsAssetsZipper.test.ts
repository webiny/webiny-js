import { createCmsAssetsZipper } from "~tests/mocks/createCmsAssetsZipper";
import { createEntryAssets } from "~tests/mocks/createEntryAssets";
import { useHandler } from "~tests/helpers/useHandler";
import { AUTHOR_MODEL_ID } from "~tests/mocks/model";
import type { Context } from "~/types";
import type { ICmsAssetsZipperExecuteParams } from "~/tasks/utils/cmsAssetsZipper";
import {
    CmsAssetsZipperExecuteContinueWithoutResult,
    CmsAssetsZipperExecuteDoneWithoutResult
} from "~/tasks/utils/cmsAssetsZipper";
import type { CmsEntryMeta } from "@webiny/api-headless-cms/types";
import type { ICmsEntryFetcherResult } from "~/tasks/utils/cmsEntryFetcher";
import type { IContentEntryTraverser } from "@webiny/api-headless-cms";
import type { IUniqueResolver } from "~/tasks/utils/uniqueResolver/abstractions/UniqueResolver";
import type { IAsset } from "~/tasks/utils/entryAssets";
import { createUniqueResolver } from "~tests/mocks/createUniqueResolver";

const defaultZipperExecuteParams: ICmsAssetsZipperExecuteParams = {
    isCloseToTimeout() {
        return false;
    },
    isAborted() {
        return false;
    },
    fileAfter: undefined,
    entryAfter: undefined
};

describe("cms assets zipper", () => {
    let context: Context;
    let traverser: IContentEntryTraverser;
    let uniqueResolver: IUniqueResolver<IAsset>;
    beforeEach(async () => {
        const { createContext } = useHandler();
        context = await createContext();
        traverser = await context.cms.getEntryTraverser(AUTHOR_MODEL_ID);
        uniqueResolver = createUniqueResolver<IAsset>();
    });

    it("should throw abort error because task was aborted", async () => {
        expect.assertions(1);

        const { cmsAssetsZipper } = createCmsAssetsZipper({
            createEntryAssets: () => {
                return createEntryAssets({
                    traverser,
                    uniqueResolver
                });
            }
        });

        try {
            await cmsAssetsZipper.execute({
                ...defaultZipperExecuteParams,
                isAborted() {
                    return true;
                }
            });
        } catch (ex) {
            expect(ex.message).toBe("Upload aborted.");
        }
    });

    it("should return done without result because no items were found", async () => {
        expect.assertions(1);

        const { cmsAssetsZipper } = createCmsAssetsZipper({
            createEntryAssets: () => {
                return createEntryAssets({
                    traverser,
                    uniqueResolver
                });
            }
        });

        const result = await cmsAssetsZipper.execute(defaultZipperExecuteParams);
        expect(result).toBeInstanceOf(CmsAssetsZipperExecuteDoneWithoutResult);
    });

    it("should return continue without result because no assets were found and timeout is close", async () => {
        expect.assertions(1);

        let isCloseToTimeout = false;

        const { cmsAssetsZipper } = createCmsAssetsZipper({
            entryFetcher: async after => {
                const meta: CmsEntryMeta = {
                    hasMoreItems: false,
                    totalCount: 2,
                    cursor: "1"
                };
                if (after === "1") {
                    return {
                        items: [
                            {
                                id: "2"
                            }
                        ],
                        meta: {
                            ...meta,
                            hasMoreItems: true,
                            cursor: "2"
                        }
                    } as ICmsEntryFetcherResult;
                } else if (after === "2") {
                    return {
                        items: [],
                        meta: {
                            ...meta,
                            cursor: "2"
                        }
                    } as ICmsEntryFetcherResult;
                }
                return {
                    items: [
                        {
                            id: "1"
                        }
                    ],
                    meta: {
                        ...meta,
                        hasMoreItems: true
                    }
                } as ICmsEntryFetcherResult;
            },
            createEntryAssets: () => {
                return createEntryAssets({
                    traverser,
                    uniqueResolver
                });
            }
        });

        const result = await cmsAssetsZipper.execute({
            ...defaultZipperExecuteParams,
            isCloseToTimeout() {
                const result = isCloseToTimeout;
                if (!result) {
                    isCloseToTimeout = true;
                }
                return result;
            }
        });
        expect(result).toBeInstanceOf(CmsAssetsZipperExecuteContinueWithoutResult);
    });
});
