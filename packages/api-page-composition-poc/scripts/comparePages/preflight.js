/**
 * Refuse to compare against an app that is not serving this run's composition.
 *
 * This exists because of a real hour lost. Two instances of the website app were running on
 * neighbouring ports, the harness defaults to one of them, and probing during a recompose returned
 * 500s that read exactly like a rendering regression. Nothing in the output said which app had been
 * photographed, so the screenshots could not be used to tell the difference.
 *
 * A comparison harness that silently photographs the wrong app produces confident, wrong evidence,
 * which is worse than producing none. So it checks first, names the URL it is talking to, and stops
 * with both titles quoted when they disagree.
 */

const titleOf = html => {
    const match = /<title[^>]*>([^<]*)<\/title>/i.exec(html ?? "");
    return match ? match[1].trim() : "";
};

/**
 * A page whose title the app should agree with.
 *
 * Never `/`. One path, four runs, and whichever composed last wins it — a mismatch there is the
 * known collision rather than the wrong app, and preflighting on it would fail every run but one.
 */
const witness = map =>
    (map?.pages ?? []).find(page => page.path !== "/" && page.title && page.pageId) ?? null;

export const assertWebsiteServesRun = async ({ website, site, map }) => {
    const page = witness(map);
    if (!page) {
        // Nothing to check against. Said out loud rather than passed over, because an unchecked run
        // is the state this whole file exists to make impossible to reach silently.
        return { checked: false, note: "no page with a title to check against" };
    }

    const url = `${website}${page.path}`;
    let response;
    try {
        response = await fetch(url, { redirect: "follow" });
    } catch (error) {
        throw new Error(
            `${site}: cannot reach the website app at ${website} (${String(error.message).slice(0, 80)}).\n` +
                `  Start it, and set WEBSITE_URL if it is not on ${website} — a second instance on ` +
                `another port is the usual reason this fails.`
        );
    }

    if (!response.ok) {
        throw new Error(
            `${site}: ${url} returned ${response.status}.\n` +
                `  A composed page that does not render cannot be compared. If a composition is ` +
                `running, wait for it to finish — pages are deleted and recreated while it does, ` +
                `and probing mid-flight returns errors that look like a rendering defect.`
        );
    }

    const served = titleOf(await response.text());
    if (served !== page.title) {
        throw new Error(
            `${site}: the app at ${website} is not serving this run's composition.\n` +
                `  ${page.path}\n` +
                `    the page map says: "${page.title}"\n` +
                `    the app served:    "${served || "(no title)"}"\n` +
                `  Either this is a different app, or it is serving a composition older than the ` +
                `page map. Comparing against it would produce screenshots of the wrong pages.`
        );
    }

    return { checked: true, url: website, witness: page.path };
};
