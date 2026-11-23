/*
 * The areas of the suite, in the order the README lists them. An area is a folder under `tests/`
 * and a tag of the same meaning on every test in it: `yarn e2e --tag <name>` runs the area.
 *
 * An area may have parts. A part's tag is `<area>-<part>`, its tests live in
 * `tests/<folder>/<part>/` and carry both the area tag and the part tag, so the area tag runs all
 * of its parts and the part tag runs one.
 *
 * Aliases are short names for an area or a part. They are never tags: tests carry only the area
 * and part tags.
 *
 * `yarn e2e:areas` (scripts/checkAreas.ts) checks this list against the tests.
 */

/** A licence tag: what a test needs from the project. See README.md, "Tags". */
export type AreaNeed = "wcp" | "ai";

export interface AreaPart {
    // The part's own name. Its tag is `<area>-<name>` and its folder `tests/<area folder>/<name>/`.
    name: string;
    aliases?: readonly string[];
    description: string;
}

export interface Area {
    // The area's tag.
    name: string;
    // The folder under `tests/`.
    folder: string;
    aliases?: readonly string[];
    // One line: what the area covers.
    description: string;
    // The licence tags its tests carry, together.
    needs: readonly AreaNeed[];
    parts?: readonly AreaPart[];
}

export const AREAS: readonly Area[] = [
    {
        name: "login",
        folder: "login",
        description: "The admin signs in through the sign-in form.",
        needs: []
    },
    {
        name: "api",
        folder: "api",
        description: "A custom HTTP route declared with `<Api.Route>` answers GET and POST.",
        needs: []
    },
    {
        name: "file-manager",
        folder: "fileManager",
        aliases: ["fm"],
        description:
            "Upload, listing and delivery of files, private files, and AI image enrichment.",
        needs: ["wcp", "ai"]
    },
    {
        name: "tenancy",
        folder: "tenancy",
        description: "A new tenant is created and installed, and delivers its own files.",
        needs: ["wcp"]
    },
    {
        name: "cms",
        folder: "cms",
        description:
            "Headless CMS models built in the editor, and entries from draft to bulk publish.",
        needs: [],
        parts: [
            {
                name: "models",
                description: "Model groups and models created, edited and deleted in the UI."
            },
            {
                name: "entries",
                description:
                    "Entries edited, published and revised; listed, searched, filtered, trashed, moved and published in bulk."
            }
        ]
    },
    {
        name: "workflows",
        folder: "workflows",
        aliases: ["wf"],
        description: "Workflow editor, publish guard and content reviews from request to publish.",
        needs: ["wcp"]
    }
];

/** The tag of an area's part. */
export const partTag = (area: Pick<Area, "name">, part: Pick<AreaPart, "name">): string => {
    return `${area.name}-${part.name}`;
};
