export type IHashingAlgorithm = "MD5" | "SHA-1" | "SHA-256" | "SHA-512";

export const createHashing = (algorithm: IHashingAlgorithm) => {
    return async (value: unknown) => {
        const data = JSON.stringify(value);
        return new Promise<string>(resolve => {
            window.crypto.subtle.digest(algorithm, new TextEncoder().encode(data)).then(encoded => {
                const hexes: string[] = [];
                const view = new DataView(encoded);
                for (let i = 0; i < view.byteLength; i += 4) {
                    hexes.push(("00000000" + view.getUint32(i).toString(16)).slice(-8));
                }
                const hash = hexes.join("");
                resolve(hash);
            });
        });
    };
};
