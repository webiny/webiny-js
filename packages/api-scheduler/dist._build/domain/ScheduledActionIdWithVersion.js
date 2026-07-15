class ScheduledActionIdWithVersion {
    static from(id) {
        if (id.endsWith("#0001")) return id;
        return `${id}#0001`;
    }
}
export { ScheduledActionIdWithVersion };

//# sourceMappingURL=ScheduledActionIdWithVersion.js.map