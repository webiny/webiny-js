import _ from "lodash";
import axios from "axios";

class Uploader {
    constructor(api) {
        this.api = api;
        this.pending = [];
        this.inProgress = null;
        this.request = null;
        this.cancelRequest = null;
    }

    getQueue() {
        return this.pending;
    }

    upload(file, progress = _.noop, done = _.noop, error = _.noop) {
        if (!progress) {
            progress = _.noop;
        }
        const id = _.uniqueId("file-upload-");
        this.pending.push({ id, file, progress, done, error });
        this.process();
        return id;
    }

    abort(id) {
        if (this.inProgress && this.inProgress.id === id) {
            this.request.cancel();
        }
        this.pending.splice(_.findIndex(this.pending, { id }), 1);
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
        const done = this.inProgress.done;
        const error = this.inProgress.error || _.noop;

        const uploadDone = response => {
            const jobId = this.inProgress.id;
            this.inProgress = null;
            if (!response.code) {
                done({ file: response.data.data, response });
            } else {
                error({ response: response.data, image, jobId });
            }
            this.process();
        };

        const method = image.id ? "patch" : "post";
        const url = image.id || "/";

        this.request = this.api[method](url, {
            data: image,
            onUploadProgress: pe => {
                const percentage = Math.round(pe.loaded / pe.total * 100);
                this.inProgress.progress({ event: pe, percentage });
            },
            cancelToken: new axios.CancelToken(cancel => {
                this.cancelRequest = cancel;
            })
        })
            .then(uploadDone)
            .catch(err => {
                return axios.isCancel(err) ? null : err.response.data;
            });
    }
}

export default Uploader;
