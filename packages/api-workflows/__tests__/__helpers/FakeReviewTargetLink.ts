import { ReviewTargetLink } from "~/features/notifications/ReviewTargetLink/index.js";

/**
 * A `ReviewTargetLink` for the `cms.*` namespaces, shaped like the CMS adapter's (`api-headless-cms-workflows`
 * is not a dependency of this package). `paths` records every path it was asked for, so a test can
 * prove that no link was built. Register with `container.registerInstance(ReviewTargetLink, fake)`.
 */
export class FakeReviewTargetLink implements ReviewTargetLink.Interface {
    public readonly paths: string[] = [];

    public canLink(model: string): boolean {
        return model.startsWith("cms.");
    }

    public getPath(params: ReviewTargetLink.Params): string {
        const path = `/cms/content-entries/article?id=${encodeURIComponent(params.targetRevisionId)}`;
        this.paths.push(path);
        return path;
    }
}
