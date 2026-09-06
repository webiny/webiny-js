/*
 * `preferCurrentTab` is a Chrome addition that puts the current tab at the top of the
 * share picker. It is not in the DOM lib types yet, so we widen the options type rather
 * than cast at the call site.
 */
interface ICurrentTabDisplayMediaOptions extends DisplayMediaStreamOptions {
    preferCurrentTab?: boolean;
}

function waitTwoFrames(): Promise<void> {
    return new Promise(resolve => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
        });
    });
}

async function grabFrame(stream: MediaStream): Promise<string> {
    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;

    await video.play();
    await waitTwoFrames();

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) {
        throw new Error("Canvas 2D context is unavailable.");
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    video.pause();
    video.srcObject = null;

    return canvas.toDataURL("image/png");
}

/*
 * Screenshots the current tab through the screen-capture API. No dependency, and what lands
 * in the issue is what the browser actually painted — canvases, iframes and cross-origin
 * images included, all of which a DOM rasteriser gets wrong. The cost is the browser's own
 * share prompt, which needs one click. Returns null when the person dismisses it.
 *
 * Must be called from a user gesture: transient activation lasts a few seconds, which is
 * why the caller can wait for a repaint first and still get the prompt.
 */
export async function captureScreenshot(): Promise<string | null> {
    if (!navigator.mediaDevices?.getDisplayMedia) {
        return null;
    }

    const options: ICurrentTabDisplayMediaOptions = {
        video: true,
        audio: false,
        preferCurrentTab: true
    };

    let stream: MediaStream | null = null;

    try {
        stream = await navigator.mediaDevices.getDisplayMedia(options);
        return await grabFrame(stream);
    } catch {
        return null;
    } finally {
        if (stream) {
            for (const track of stream.getTracks()) {
                track.stop();
            }
        }
    }
}
