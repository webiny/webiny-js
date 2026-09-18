export interface IRepositoryRef {
    owner: string;
    name: string;
}

export function parseRepository(repository: string): IRepositoryRef {
    const segments = repository.split("/");
    const [owner, name] = segments;

    /*
     * Exactly two: "acme/app/extra" would otherwise silently drop the tail and 404 at GitHub,
     * which reads as a missing repository rather than as the typo it is.
     */
    if (segments.length !== 2 || !owner || !name) {
        throw new Error(`"${repository}" is not a valid repository. Use the "owner/name" form.`);
    }

    return { owner, name };
}
