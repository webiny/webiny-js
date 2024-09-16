// We only list current version migrations here. No need to have them all
// listed, as we only need the latest version migrations to be executed.
// This also helps with keeping the bundle size down / faster boot times.
import { AdminUsers_5_41_0_001 } from "~/migrations/5.41.0/001";

export const migrations = () => {
    return [AdminUsers_5_41_0_001];
};
