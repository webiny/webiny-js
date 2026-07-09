import { execaSync } from "execa";

export class IsGitAvailable {
    execute() {
        try {
            execaSync("git", ["--version"]);
            return true;
        } catch {
            return false;
        }
    }
}
