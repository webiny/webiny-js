/*
 * What an editor does to show the content again after an AI or automation step changed it while
 * the editor was locked (R262). Built by the apps (the CMS form, the WB page editor) and handed to
 * the review presenter through its init parameters. `reload` resolves `true` when the reloaded
 * revision differs from the loaded one; it never re-initialises the review presenter.
 */
export interface IReviewContentReloader {
    reload(): Promise<boolean>;
}
