import type { Archiver } from "archiver";

export interface IArchiver {
    archiver: Pick<Archiver, "append" | "finalize" | "pipe" | "on">;
}
