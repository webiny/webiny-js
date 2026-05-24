export class GithubRelease {
    private constructor(private readonly value: boolean | "latest") {}

    static from(input: unknown): GithubRelease {
        if (input === "latest") {
            return new GithubRelease("latest");
        }

        if (typeof input === "boolean") {
            return new GithubRelease(input);
        }

        if (input === "true") {
            return new GithubRelease(true);
        }

        return new GithubRelease(false);
    }

    isEnabled(): boolean {
        return this.value !== false;
    }

    isLatest(): boolean {
        return this.value === "latest";
    }

    toValue(): boolean | "latest" {
        return this.value;
    }
}
