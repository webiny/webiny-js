import _ from 'lodash';

class Uploader {

    constructor(api) {
        this.api = api;
        this.pending = [];
        this.inProgress = null;
        this.request = null;
    }

    getQueue() {
        return this.pending;
    }

    upload(file, progress = _.noop, done = _.noop, error = _.noop) {
        if (!progress) {
            progress = _.noop;
        }
        const id = _.uniqueId('file-upload-');
        this.pending.push({id, file, progress, done, error});
        this.process();
        return id;
    }

    abort(id) {
        if (this.inProgress && this.inProgress.id === id) {
            this.request.cancel();
        }
        this.pending.splice(_.findIndex(this.pending, {id}), 1);
    }

    isInProgress(id) {
        return this.inProgress && this.inProgress.id === id;
    }

    process() {
        if (this.inProgress || !this.pending.length) {
            return;
        }

        this.inProgress = this.pending.shift();

        const image = this.inProgress.file;
        const progressHandler = (pe) => {
            const percentage = Math.round(pe.loaded / pe.total * 100);
            this.inProgress.progress({event: pe, percentage});
        };
        const done = this.inProgress.done;
        const error = this.inProgress.error || _.noop;

        const uploadDone = (apiResponse) => {
            const jobId = this.inProgress.id;
            this.inProgress = null;
            if (!apiResponse.isError() && !apiResponse.isAborted()) {
                done({file: apiResponse.getData(), apiResponse});
            } else {
                error({apiResponse, image, jobId});
            }
            this.process();
        };

        if (image.id) {
            this.request = this.api.setBody(image).setConfig({progress: progressHandler}).patch(image.id).then(uploadDone);
        } else {
            this.request = this.api.setBody(image).setConfig({progress: progressHandler}).post('/').then(uploadDone);
        }
    }
}

export default Uploader;