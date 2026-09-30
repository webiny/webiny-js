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
 * when the page served is not the page the map names.
 *
 * It checks the page ID rather than the title. Titles only distinguish one SITE from another, and
 * the collision that actually bites is between COMPOSITIONS of the same site, which share titles
 * exactly.
 */

const titleOf = html => {
    const match = /<title[^>]*>([^<]*)<\/title>/i.exec(html ?? "");
    return match ? match[1].trim() : "";
};

/**
 * Whether the served HTML is the page with this id.
 *
 * The rendered document carries its own page id, so this asks the exact question — is this the page
 * the map names — rather than the approximate one. The title check it replaces compared copy, which
 * catches a page from another SITE answering the path, and cannot catch one from another
 * COMPOSITION of the same site, because those produce identical titles. Every path had up to four
 * claimants when this was written, so the approximate question was the wrong one.
 */
const servesPageId = (html, pageId) => (html ?? "").includes(pageId);

/**
 * A page the app should agree with.
 *
 * Never `/`. Every site's home page composes to that one path, so a mismatch there is the known
 * cross-site collision rather than the wrong app, and preflighting on it would fail every run but
 * one.
 */
const witness = map => (map?.pages ?? []).find(page => page.path !== "/" && page.pageId) ?? null;

export const assertWebsiteServesRun = async ({ website, site, map }) => {
    const page = witness(map);
    if (!page) {
        // Nothing to check against. Said out loud rather than passed over, because an unchecked run
        // is the state this whole file exists to make impossible to reach silently.
        return { checked: false, note: "no page with an id to check against" };
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

    const html = await response.text();
    if (!servesPageId(html, page.pageId)) {
        throw new Error(
            `${site}: the app at ${website} is not serving this run's composition.\n` +
                `  ${page.path}\n` +
                `    the page map says page id: ${page.pageId}\n` +
                `    the app served the page:   "${titleOf(html) || "(no title)"}", which does not carry that id\n` +
                `  Several published pages can claim one path — every composition of a run creates a\n` +
                `  new set and the previous set stays published — so the path is answering with a\n` +
                `  different page. Comparing against it would photograph the wrong composition.`
        );
    }

    return { checked: true, url: website, witness: page.path };
};
