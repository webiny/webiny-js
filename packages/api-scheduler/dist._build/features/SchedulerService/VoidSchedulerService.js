class VoidSchedulerService {
    constructor(callbacks){
        this.callbacks = callbacks;
    }
    async create(params) {
        if (!this.callbacks?.create) return;
        return this.callbacks?.create(params);
    }
    async update(params) {
        if (!this.callbacks?.update) return;
        return this.callbacks?.update(params);
    }
    async delete(params) {
        if (!this.callbacks?.delete) return;
        return this.callbacks.delete(params);
    }
    async exists(params) {
        if (!this.callbacks?.exists) return false;
        return this.callbacks.exists(params);
    }
}
export { VoidSchedulerService };

//# sourceMappingURL=VoidSchedulerService.js.map