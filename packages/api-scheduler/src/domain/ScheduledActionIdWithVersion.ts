export class ScheduledActionIdWithVersion {
    static from(id: string) {
        if (id.endsWith("#0001")) {
            return id;
        }

        return `${id}#0001`;
    }
}
