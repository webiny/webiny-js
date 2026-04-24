/*
 * libpannellum - A WebGL and CSS 3D transform based Panorama Renderer
 * Copyright (c) 2012-2026 Matthew Petroff
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

window.libpannellum = (function (window, document, undefined) {
    "use strict";

    /**
     * Creates a new panorama renderer.
     * @constructor
     * @param {HTMLElement} container - The container element for the renderer.
     * @param {WebGLRenderingContext} [context] - Existing WebGL context (instead of container).
     */
    function Renderer(container, context) {
        var canvas;
        if (container) {
            canvas = document.createElement("canvas");
            canvas.style.width = canvas.style.height = "100%";
            container.appendChild(canvas);
        }

        var program, gl, vs, fs;
        var previewProgram, previewVs, previewFs;
        var fallbackImgSize;
        var world;
        var vtmps;
        var pose;
        var image, imageType;
        var texCoordBuffer, cubeVertBuf, cubeVertTexCoordBuf, cubeVertIndBuf;
        var globalParams;
        var sides = ["f", "b", "u", "d", "l", "r"];
        var fallbackSides = ["f", "r", "b", "l", "u", "d"];

        if (context) {
            gl = context;
        }

        /**
         * Initialize renderer.
         * @memberof Renderer
         * @instance
         * @param {Image|Array|Object} image - Input image; format varies based on
         *      `imageType`. For `equirectangular`, this is an image; for
         *      `cubemap`, this is an array of images for the cube faces in the
         *      order [+z, +x, -z, -x, +y, -y]; for `multires`, this is a
         *      configuration object.
         * @param {string} imageType - The type of the image: `equirectangular`,
         *      `cubemap`, or `multires`.
         * @param {number} haov - Initial horizontal angle of view.
         * @param {number} vaov - Initial vertical angle of view.
         * @param {number} voffset - Initial vertical offset angle.
         * @param {function} callback - Load callback function.
         * @param {Object} [params] - Other configuration parameters (`horizonPitch`, `horizonRoll`, `backgroundColor`).
         */
        this.init = function (_image, _imageType, haov, vaov, voffset, callback, params) {
            // Default argument for image type
            if (_imageType === undefined) {
                _imageType = "equirectangular";
            }

            if (
                _imageType != "equirectangular" &&
                _imageType != "cubemap" &&
                _imageType != "multires"
            ) {
                console.log("Error: invalid image type specified!");
                throw { type: "config error" };
            }

            imageType = _imageType;
            image = _image;
            globalParams = params || {};

            // Clear old data
            if (program) {
                if (vs) {
                    gl.detachShader(program, vs);
                    gl.deleteShader(vs);
                }
                if (fs) {
                    gl.detachShader(program, fs);
                    gl.deleteShader(fs);
                }
                gl.bindBuffer(gl.ARRAY_BUFFER, null);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
                if (program.texture) {
                    gl.deleteTexture(program.texture);
                }
                if (program.nodeCache) {
                    for (var i = 0; i < program.nodeCache.length; i++)
                        gl.deleteTexture(program.nodeCache[i].texture);
                }
                if (program.textureLoads) {
                    pendingTextureRequests = [];
                    while (program.textureLoads.length > 0) {
                        program.textureLoads.shift()(false);
                    }
                }
                gl.deleteProgram(program);
                program = undefined;
            }
            if (previewProgram) {
                if (previewVs) {
                    gl.detachShader(previewProgram, previewVs);
                    gl.deleteShader(previewVs);
                }
                if (previewFs) {
                    gl.detachShader(previewProgram, previewFs);
                    gl.deleteShader(previewFs);
                }
                gl.deleteProgram(previewProgram);
                previewProgram = undefined;
            }
            pose = undefined;

            var s;
            var faceMissing = false;
            var cubeImgWidth;
            if (imageType == "cubemap") {
                for (s = 0; s < 6; s++) {
                    if (image[s].width > 0) {
                        if (cubeImgWidth === undefined) {
                            cubeImgWidth = image[s].width;
                        }
                        if (cubeImgWidth != image[s].width) {
                            console.log(
                                "Cube faces have inconsistent widths: " +
                                    cubeImgWidth +
                                    " vs. " +
                                    image[s].width
                            );
                        }
                    } else {
                        faceMissing = true;
                    }
                }
            }
            function fillMissingFaces(imgSize) {
                if (faceMissing) {
                    // Fill any missing fallback/cubemap faces with background
                    var nbytes = imgSize * imgSize * 4; // RGB, plus non-functional alpha
                    var imageArray = new Uint8ClampedArray(nbytes);
                    var rgb = params.backgroundColor ? params.backgroundColor : [0, 0, 0];
                    rgb[0] *= 255;
                    rgb[1] *= 255;
                    rgb[2] *= 255;
                    // Maybe filling could be done faster, see e.g., https://stackoverflow.com/questions/1295584/most-efficient-way-to-create-a-zero-filled-javascript-array
                    for (var i = 0; i < nbytes; i++) {
                        imageArray[i++] = rgb[0];
                        imageArray[i++] = rgb[1];
                        imageArray[i++] = rgb[2];
                    }
                    var backgroundSquare = new ImageData(imageArray, imgSize, imgSize);
                    for (s = 0; s < 6; s++) {
                        if (image[s].width == 0) {
                            image[s] = backgroundSquare;
                        }
                    }
                }
            }

            // This awful browser specific test exists because iOS 8/9 and IE 11
            // don't display non-power-of-two cubemap textures but also don't
            // throw an error (tested on an iPhone 5c / iOS 8.1.3 / iOS 9.2 /
            // iOS 10.3.1).
            // Therefore, the WebGL context is never created for these browsers for
            // NPOT cubemaps, and the CSS 3D transform fallback renderer is used
            // instead.
            if (
                !(
                    imageType == "cubemap" &&
                    (cubeImgWidth & (cubeImgWidth - 1)) !== 0 &&
                    (navigator.userAgent.toLowerCase().match(/(iphone|ipod|ipad).* os 8_/) ||
                        navigator.userAgent.toLowerCase().match(/(iphone|ipod|ipad).* os 9_/) ||
                        navigator.userAgent.toLowerCase().match(/(iphone|ipod|ipad).* os 10_/) ||
                        navigator.userAgent.match(/Trident.*rv[ :]*11\./))
                )
            ) {
                // Enable WebGL on canvas
                if (!gl) {
                    gl = canvas.getContext("experimental-webgl", { alpha: false, depth: false });
                }
                if (gl && gl.getError() == 1286) {
                    handleWebGLError1286();
                }
            }

            // If there is no WebGL, fall back to CSS 3D transform renderer.
            // This will discard the image loaded so far and load the fallback image.
            // While browser specific tests are usually frowned upon, the
            // fallback viewer only really works with WebKit/Blink and IE 10/11
            // (it doesn't work properly in Firefox).
            if (
                !gl &&
                ((imageType == "multires" && image.hasOwnProperty("fallbackPath")) ||
                    imageType == "cubemap") &&
                ("WebkitAppearance" in document.documentElement.style ||
                    navigator.userAgent.match(/Trident.*rv[ :]*11\./) ||
                    navigator.appVersion.indexOf("MSIE 10") !== -1)
            ) {
                // Remove old world if it exists
                if (world) {
                    container.removeChild(world);
                }

                // Initialize renderer
                world = document.createElement("div");
                world.className = "pnlm-world";

                // Add images
                var path;
                if (image.basePath) {
                    path = image.basePath + image.fallbackPath;
                } else {
                    path = image.fallbackPath;
                }
                var loaded = 0;
                var onLoad = function () {
                    // Draw image on canvas
                    var faceCanvas = document.createElement("canvas");
                    faceCanvas.className = "pnlm-face pnlm-" + fallbackSides[this.side] + "face";
                    world.appendChild(faceCanvas);
                    var faceContext = faceCanvas.getContext("2d");
                    faceCanvas.style.width = this.width + 4 + "px";
                    faceCanvas.style.height = this.height + 4 + "px";
                    faceCanvas.width = this.width + 4;
                    faceCanvas.height = this.height + 4;
                    faceContext.drawImage(this, 2, 2);
                    var imgData = faceContext.getImageData(
                        0,
                        0,
                        faceCanvas.width,
                        faceCanvas.height
                    );
                    var data = imgData.data;

                    // Duplicate edge pixels
                    var i;
                    var j;
                    for (i = 2; i < faceCanvas.width - 2; i++) {
                        for (j = 0; j < 4; j++) {
                            data[(i + faceCanvas.width) * 4 + j] =
                                data[(i + faceCanvas.width * 2) * 4 + j];
                            data[(i + faceCanvas.width * (faceCanvas.height - 2)) * 4 + j] =
                                data[(i + faceCanvas.width * (faceCanvas.height - 3)) * 4 + j];
                        }
                    }
                    for (i = 2; i < faceCanvas.height - 2; i++) {
                        for (j = 0; j < 4; j++) {
                            data[(i * faceCanvas.width + 1) * 4 + j] =
                                data[(i * faceCanvas.width + 2) * 4 + j];
                            data[((i + 1) * faceCanvas.width - 2) * 4 + j] =
                                data[((i + 1) * faceCanvas.width - 3) * 4 + j];
                        }
                    }
                    for (j = 0; j < 4; j++) {
                        data[(faceCanvas.width + 1) * 4 + j] =
                            data[(faceCanvas.width * 2 + 2) * 4 + j];
                        data[(faceCanvas.width * 2 - 2) * 4 + j] =
                            data[(faceCanvas.width * 3 - 3) * 4 + j];
                        data[(faceCanvas.width * (faceCanvas.height - 2) + 1) * 4 + j] =
                            data[(faceCanvas.width * (faceCanvas.height - 3) + 2) * 4 + j];
                        data[(faceCanvas.width * (faceCanvas.height - 1) - 2) * 4 + j] =
                            data[(faceCanvas.width * (faceCanvas.height - 2) - 3) * 4 + j];
                    }
                    for (i = 1; i < faceCanvas.width - 1; i++) {
                        for (j = 0; j < 4; j++) {
                            data[i * 4 + j] = data[(i + faceCanvas.width) * 4 + j];
                            data[(i + faceCanvas.width * (faceCanvas.height - 1)) * 4 + j] =
                                data[(i + faceCanvas.width * (faceCanvas.height - 2)) * 4 + j];
                        }
                    }
                    for (i = 1; i < faceCanvas.height - 1; i++) {
                        for (j = 0; j < 4; j++) {
                            data[i * faceCanvas.width * 4 + j] =
                                data[(i * faceCanvas.width + 1) * 4 + j];
                            data[((i + 1) * faceCanvas.width - 1) * 4 + j] =
                                data[((i + 1) * faceCanvas.width - 2) * 4 + j];
                        }
                    }
                    for (j = 0; j < 4; j++) {
                        data[j] = data[(faceCanvas.width + 1) * 4 + j];
                        data[(faceCanvas.width - 1) * 4 + j] =
                            data[(faceCanvas.width * 2 - 2) * 4 + j];
                        data[faceCanvas.width * (faceCanvas.height - 1) * 4 + j] =
                            data[(faceCanvas.width * (faceCanvas.height - 2) + 1) * 4 + j];
                        data[(faceCanvas.width * faceCanvas.height - 1) * 4 + j] =
                            data[(faceCanvas.width * (faceCanvas.height - 1) - 2) * 4 + j];
                    }

                    // Draw image width duplicated edge pixels on canvas
                    faceContext.putImageData(imgData, 0, 0);

                    incLoaded.call(this);
                };
                var incLoaded = function () {
                    if (this.width > 0) {
                        if (fallbackImgSize === undefined) {
                            fallbackImgSize = this.width;
                        }
                        if (fallbackImgSize != this.width) {
                            console.log(
                                "Fallback faces have inconsistent widths: " +
                                    fallbackImgSize +
                                    " vs. " +
                                    this.width
                            );
                        }
                    } else {
                        faceMissing = true;
                    }
                    loaded++;
                    if (loaded == 6) {
                        fallbackImgSize = this.width;
                        container.appendChild(world);
                        callback();
                    }
                };
                faceMissing = false;
                for (s = 0; s < 6; s++) {
                    var faceImg = new Image();
                    faceImg.crossOrigin = globalParams.crossOrigin
                        ? globalParams.crossOrigin
                        : "anonymous";
                    faceImg.side = s;
                    faceImg.onload = onLoad;
                    faceImg.onerror = incLoaded; // ignore missing face to support partial fallback image
                    if (imageType == "multires") {
                        faceImg.src =
                            path.replace("%s", fallbackSides[s]) +
                            (image.extension ? "." + image.extension : "");
                    } else {
                        faceImg.src = image[s].src;
                    }
                }
                fillMissingFaces(fallbackImgSize);
                return;
            } else if (!gl) {
                console.log("Error: no WebGL support detected!");
                throw { type: "no webgl" };
            }
            if (imageType == "cubemap") {
                fillMissingFaces(cubeImgWidth);
            }
            if (image.basePath) {
                image.fullpath = image.basePath + image.path;
            } else {
                image.fullpath = image.path;
            }
            image.invTileResolution = 1 / image.tileResolution;

            var vertices = createCube();
            vtmps = [];
            for (s = 0; s < 6; s++) {
                vtmps[s] = vertices.slice(s * 12, s * 12 + 12);
                vertices = createCube();
            }

            // Make sure image isn't too big
            var maxWidth = 0;
            if (imageType == "equirectangular") {
                maxWidth = gl.getParameter(gl.MAX_TEXTURE_SIZE);
                if (Math.max(image.width / 2, image.height) > maxWidth) {
                    console.log(
                        "Error: The image is too big; it's " +
                            image.width +
                            "px wide, " +
                            "but this device's maximum supported size is " +
                            maxWidth * 2 +
                            "px."
                    );
                    throw { type: "webgl size error", width: image.width, maxWidth: maxWidth * 2 };
                }
            } else if (imageType == "cubemap") {
                if (cubeImgWidth > gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE)) {
                    console.log(
                        "Error: The image is too big; it's " +
                            cubeImgWidth +
                            "px wide, " +
                            "but this device's maximum supported size is " +
                            maxWidth +
                            "px."
                    );
                    throw { type: "webgl size error", width: cubeImgWidth, maxWidth: maxWidth };
                }
            }

            // Store horizon pitch and roll if applicable
            if (params !== undefined) {
                var horizonPitch = isNaN(params.horizonPitch) ? 0 : Number(params.horizonPitch),
                    horizonRoll = isNaN(params.horizonRoll) ? 0 : Number(params.horizonRoll);
                if (horizonPitch != 0 || horizonRoll != 0) {
                    pose = [horizonPitch, horizonRoll];
                }
            }

            // Set 2d texture binding
            var glBindType = gl.TEXTURE_2D;

            // Create viewport for entire canvas
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

            // Check precision support
            if (gl.getShaderPrecisionFormat) {
                var precision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
                if (precision && precision.precision < 1) {
                    // `highp` precision not supported; https://stackoverflow.com/a/33308927
                    fragEquiCubeBase = fragEquiCubeBase.replace("highp", "mediump");
                }
            }

            // Create vertex shader
            vs = gl.createShader(gl.VERTEX_SHADER);
            var vertexSrc = v;
            if (imageType == "multires") {
                vertexSrc = vMulti;
            }
            gl.shaderSource(vs, vertexSrc);
            gl.compileShader(vs);

            // Create fragment shader
            fs = gl.createShader(gl.FRAGMENT_SHADER);
            var fragmentSrc = fragEquirectangular;
            if (imageType == "cubemap") {
                glBindType = gl.TEXTURE_CUBE_MAP;
                fragmentSrc = fragCube;
            } else if (imageType == "multires") {
                fragmentSrc = fragMulti;
            }
            gl.shaderSource(fs, fragmentSrc);
            gl.compileShader(fs);

            // Link WebGL program
            program = gl.createProgram();
            gl.attachShader(program, vs);
            gl.attachShader(program, fs);
            gl.linkProgram(program);

            // Log errors
            if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
                console.log(gl.getShaderInfoLog(vs));
            }
            if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
                console.log(gl.getShaderInfoLog(fs));
            }
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.log(gl.getProgramInfoLog(program));
            }

            // Use WebGL program
            gl.useProgram(program);

            program.drawInProgress = false;

            // Set background clear color (does not apply to cubemap/fallback image)
            if (params.backgroundColor !== null) {
                var color = params.backgroundColor ? params.backgroundColor : [0, 0, 0];
                gl.clearColor(color[0], color[1], color[2], 1.0);
                gl.clear(gl.COLOR_BUFFER_BIT);
            }

            // Look up texture coordinates location
            program.texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
            gl.enableVertexAttribArray(program.texCoordLocation);

            if (imageType != "multires") {
                // Provide texture coordinates for rectangle
                if (!texCoordBuffer) {
                    texCoordBuffer = gl.createBuffer();
                }
                gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
                gl.bufferData(
                    gl.ARRAY_BUFFER,
                    new Float32Array([-1, 1, 1, 1, 1, -1, -1, 1, 1, -1, -1, -1]),
                    gl.STATIC_DRAW
                );
                gl.vertexAttribPointer(program.texCoordLocation, 2, gl.FLOAT, false, 0, 0);

                // Pass aspect ratio
                program.aspectRatio = gl.getUniformLocation(program, "u_aspectRatio");
                gl.uniform1f(program.aspectRatio, gl.drawingBufferWidth / gl.drawingBufferHeight);

                // Locate psi, theta, focal length, horizontal extent, vertical extent, and vertical offset
                program.psi = gl.getUniformLocation(program, "u_psi");
                program.theta = gl.getUniformLocation(program, "u_theta");
                program.f = gl.getUniformLocation(program, "u_f");
                program.h = gl.getUniformLocation(program, "u_h");
                program.v = gl.getUniformLocation(program, "u_v");
                program.vo = gl.getUniformLocation(program, "u_vo");
                program.rot = gl.getUniformLocation(program, "u_rot");

                // Pass horizontal extent, vertical extent, and vertical offset
                gl.uniform1f(program.h, haov / (Math.PI * 2.0));
                gl.uniform1f(program.v, vaov / Math.PI);
                gl.uniform1f(program.vo, (voffset / Math.PI) * 2);

                // Set background color
                if (imageType == "equirectangular") {
                    program.backgroundColor = gl.getUniformLocation(program, "u_backgroundColor");
                    gl.uniform4fv(program.backgroundColor, color.concat([1]));
                }

                // Create texture
                program.texture = gl.createTexture();
                gl.bindTexture(glBindType, program.texture);

                // Upload images to texture depending on type
                if (imageType == "cubemap") {
                    // Load all six sides of the cube map
                    gl.texImage2D(
                        gl.TEXTURE_CUBE_MAP_POSITIVE_X,
                        0,
                        gl.RGB,
                        gl.RGB,
                        gl.UNSIGNED_BYTE,
                        image[1]
                    );
                    gl.texImage2D(
                        gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
                        0,
                        gl.RGB,
                        gl.RGB,
                        gl.UNSIGNED_BYTE,
                        image[3]
                    );
                    gl.texImage2D(
                        gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
                        0,
                        gl.RGB,
                        gl.RGB,
                        gl.UNSIGNED_BYTE,
                        image[4]
                    );
                    gl.texImage2D(
                        gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
                        0,
                        gl.RGB,
                        gl.RGB,
                        gl.UNSIGNED_BYTE,
                        image[5]
                    );
                    gl.texImage2D(
                        gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                        0,
                        gl.RGB,
                        gl.RGB,
                        gl.UNSIGNED_BYTE,
                        image[0]
                    );
                    gl.texImage2D(
                        gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
                        0,
                        gl.RGB,
                        gl.RGB,
                        gl.UNSIGNED_BYTE,
                        image[2]
                    );
                } else {
                    if (image.width <= maxWidth) {
                        gl.uniform1i(gl.getUniformLocation(program, "u_splitImage"), 0);
                        // Upload image to the texture
                        gl.texImage2D(glBindType, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
                    } else {
                        // Image needs to be split into two parts due to texture size limits
                        gl.uniform1i(gl.getUniformLocation(program, "u_splitImage"), 1);

                        // Draw image on canvas
                        var cropCanvas = document.createElement("canvas");
                        cropCanvas.width = image.width / 2;
                        cropCanvas.height = image.height;
                        var cropContext = cropCanvas.getContext("2d");
                        cropContext.drawImage(image, 0, 0);

                        // Upload first half of image to the texture
                        var cropImage = cropContext.getImageData(
                            0,
                            0,
                            image.width / 2,
                            image.height
                        );
                        gl.texImage2D(glBindType, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cropImage);

                        // Create and bind texture for second half of image
                        program.texture2 = gl.createTexture();
                        gl.activeTexture(gl.TEXTURE1);
                        gl.bindTexture(glBindType, program.texture2);
                        gl.uniform1i(gl.getUniformLocation(program, "u_image1"), 1);

                        // Upload second half of image to the texture
                        cropContext.drawImage(image, -image.width / 2, 0);
                        cropImage = cropContext.getImageData(0, 0, image.width / 2, image.height);
                        gl.texImage2D(glBindType, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cropImage);

                        // Set parameters for rendering any size
                        gl.texParameteri(glBindType, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                        gl.texParameteri(glBindType, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                        gl.texParameteri(glBindType, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                        gl.texParameteri(glBindType, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

                        // Reactivate first texture unit
                        gl.activeTexture(gl.TEXTURE0);
                    }
                }

                // Set parameters for rendering any size
                if (
                    imageType != "cubemap" &&
                    image.width &&
                    image.width <= maxWidth &&
                    haov == 2 * Math.PI &&
                    (image.width & (image.width - 1)) == 0
                ) {
                    gl.texParameteri(glBindType, gl.TEXTURE_WRAP_S, gl.REPEAT);
                } // Only supported for power-of-two images in WebGL 1
                else {
                    gl.texParameteri(glBindType, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                }
                gl.texParameteri(glBindType, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(glBindType, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(glBindType, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            } else {
                // Look up vertex coordinates location
                program.vertPosLocation = gl.getAttribLocation(program, "a_vertCoord");
                gl.enableVertexAttribArray(program.vertPosLocation);

                // Create buffers
                if (!cubeVertBuf) {
                    cubeVertBuf = gl.createBuffer();
                }
                if (!cubeVertTexCoordBuf) {
                    cubeVertTexCoordBuf = gl.createBuffer();
                }
                if (!cubeVertIndBuf) {
                    cubeVertIndBuf = gl.createBuffer();
                }

                // Bind texture coordinate buffer and pass coordinates to WebGL
                gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertTexCoordBuf);
                gl.bufferData(
                    gl.ARRAY_BUFFER,
                    new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
                    gl.STATIC_DRAW
                );
                gl.vertexAttribPointer(program.texCoordLocation, 2, gl.FLOAT, false, 0, 0);

                // Bind square index buffer and pass indices to WebGL
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertIndBuf);
                gl.bufferData(
                    gl.ELEMENT_ARRAY_BUFFER,
                    new Uint16Array([0, 1, 2, 0, 2, 3]),
                    gl.STATIC_DRAW
                );

                // Bind vertex buffer
                gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertBuf);
                gl.vertexAttribPointer(program.vertPosLocation, 3, gl.FLOAT, false, 0, 0);

                // Find uniforms
                program.perspUniform = gl.getUniformLocation(program, "u_perspMatrix");
                program.cubeUniform = gl.getUniformLocation(program, "u_cubeMatrix");
                //program.colorUniform = gl.getUniformLocation(program, 'u_color');

                program.currentNodes = [];
                program.nodeCache = [];
                program.nodeCacheTimestamp = 0;
                program.textureLoads = [];

                if (image.shtHash || image.equirectangularThumbnail) {
                    // Create vertex shader
                    previewVs = gl.createShader(gl.VERTEX_SHADER);
                    gl.shaderSource(previewVs, v);
                    gl.compileShader(previewVs);

                    // Create fragment shader
                    previewFs = gl.createShader(gl.FRAGMENT_SHADER);
                    gl.shaderSource(previewFs, fragEquirectangular);
                    gl.compileShader(previewFs);

                    // Link WebGL program
                    previewProgram = gl.createProgram();
                    gl.attachShader(previewProgram, previewVs);
                    gl.attachShader(previewProgram, previewFs);
                    gl.linkProgram(previewProgram);

                    // Log errors
                    if (!gl.getShaderParameter(previewVs, gl.COMPILE_STATUS)) {
                        console.log(gl.getShaderInfoLog(previewVs));
                    }
                    if (!gl.getShaderParameter(previewFs, gl.COMPILE_STATUS)) {
                        console.log(gl.getShaderInfoLog(previewFs));
                    }
                    if (!gl.getProgramParameter(previewProgram, gl.LINK_STATUS)) {
                        console.log(gl.getProgramInfoLog(previewProgram));
                    }

                    // Use WebGL program
                    gl.useProgram(previewProgram);

                    // Look up texture coordinates location
                    previewProgram.texCoordLocation = gl.getAttribLocation(
                        previewProgram,
                        "a_texCoord"
                    );
                    gl.enableVertexAttribArray(previewProgram.texCoordLocation);

                    // Provide texture coordinates for rectangle
                    if (!texCoordBuffer) {
                        texCoordBuffer = gl.createBuffer();
                    }
                    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
                    gl.bufferData(
                        gl.ARRAY_BUFFER,
                        new Float32Array([-1, 1, 1, 1, 1, -1, -1, 1, 1, -1, -1, -1]),
                        gl.STATIC_DRAW
                    );
                    gl.vertexAttribPointer(
                        previewProgram.texCoordLocation,
                        2,
                        gl.FLOAT,
                        false,
                        0,
                        0
                    );

                    // Pass aspect ratio
                    previewProgram.aspectRatio = gl.getUniformLocation(
                        previewProgram,
                        "u_aspectRatio"
                    );
                    gl.uniform1f(
                        previewProgram.aspectRatio,
                        gl.drawingBufferWidth / gl.drawingBufferHeight
                    );

                    // Locate psi, theta, focal length, horizontal extent, vertical extent, and vertical offset
                    previewProgram.psi = gl.getUniformLocation(previewProgram, "u_psi");
                    previewProgram.theta = gl.getUniformLocation(previewProgram, "u_theta");
                    previewProgram.f = gl.getUniformLocation(previewProgram, "u_f");
                    previewProgram.h = gl.getUniformLocation(previewProgram, "u_h");
                    previewProgram.v = gl.getUniformLocation(previewProgram, "u_v");
                    previewProgram.vo = gl.getUniformLocation(previewProgram, "u_vo");
                    previewProgram.rot = gl.getUniformLocation(previewProgram, "u_rot");

                    // Pass horizontal extent
                    gl.uniform1f(previewProgram.h, 1.0);

                    // Create texture
                    previewProgram.texture = gl.createTexture();
                    gl.bindTexture(glBindType, previewProgram.texture);

                    // Upload preview image to the texture
                    var previewImage, vext, voff;
                    var uploadPreview = function () {
                        gl.useProgram(previewProgram);

                        gl.uniform1i(gl.getUniformLocation(previewProgram, "u_splitImage"), 0);
                        gl.texImage2D(
                            glBindType,
                            0,
                            gl.RGBA,
                            gl.RGBA,
                            gl.UNSIGNED_BYTE,
                            previewImage
                        );

                        // Set parameters for rendering any size
                        gl.texParameteri(glBindType, gl.TEXTURE_WRAP_S, gl.REPEAT);
                        gl.texParameteri(glBindType, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                        gl.texParameteri(glBindType, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                        gl.texParameteri(glBindType, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

                        // Pass vertical extent and vertical offset
                        gl.uniform1f(previewProgram.v, vext);
                        gl.uniform1f(previewProgram.vo, voff);

                        gl.useProgram(program);
                    };
                    if (image.shtHash) {
                        previewImage = shtDecodeImage(image.shtHash);
                        // Vertical extent & offset are chosen to set the top and bottom
                        // pixels in the preview image to be exactly at the zenith and
                        // nadir, respectively, which matches the pre-calculated Ylm
                        vext = (2 + 1 / 31) / 2;
                        voff = 1 - (2 + 1 / 31) / 2;
                        uploadPreview();
                    }
                    if (image.equirectangularThumbnail) {
                        if (typeof image.equirectangularThumbnail === "string") {
                            if (image.equirectangularThumbnail.slice(0, 5) == "data:") {
                                // Data URI
                                previewImage = new Image();
                                previewImage.onload = function () {
                                    vext = 1;
                                    voff = 0;
                                    uploadPreview();
                                };
                                previewImage.src = image.equirectangularThumbnail;
                            } else {
                                console.log("Error: thumbnail string is not a data URI!");
                                throw { type: "config error" };
                            }
                        } else {
                            // ImageData / ImageBitmap / HTMLImageElement / HTMLCanvasElement
                            previewImage = image.equirectangularThumbnail;
                            vext = 1;
                            voff = 0;
                            uploadPreview();
                        }
                    }

                    // Reactivate main program
                    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertBuf);
                    gl.vertexAttribPointer(program.vertPosLocation, 3, gl.FLOAT, false, 0, 0);
                    gl.useProgram(program);
                }

                // Parse missing tiles list, if it exists
                if (image.missingTiles) {
                    var missingTiles = [];
                    var perSide = image.missingTiles.split("!");
                    var level = -1;
                    for (var i = 1; i < perSide.length; i++) {
                        var side = perSide[i].at(0);
                        var perLevel =
                            perSide[i].indexOf(">") < 0
                                ? [side, perSide[i].slice(1)]
                                : perSide[i].split(">");
                        for (var j = 1; j < perLevel.length; j++) {
                            if (perSide[i].indexOf(">") >= 0) {
                                var level = shtB83decode(perLevel[j].at(0), 1)[0];
                            }
                            var maxTileNum =
                                Math.ceil(
                                    image.cubeResolution /
                                        Math.pow(2, image.maxLevel - level) /
                                        image.tileResolution
                                ) - 1;
                            var numTileDigits = Math.ceil(Math.log(maxTileNum + 1) / Math.log(83));
                            var tiles =
                                perLevel[j].slice(1).length > 0
                                    ? shtB83decode(perLevel[j].slice(1), numTileDigits)
                                    : [0, 0];
                            for (var k = 0; k < tiles.length / 2; k++) {
                                missingTiles.push(
                                    [side, level, tiles[k * 2], tiles[k * 2 + 1]].toString()
                                );
                            }
                        }
                    }
                    image.missingTileList = missingTiles;
                }
            }

            // Check if there was an error
            var err = gl.getError();
            if (err !== 0) {
                console.log("Error: Something went wrong with WebGL!", err);
                throw { type: "webgl error" };
            }

            callback();
        };

        /**
         * Destroy renderer.
         * @memberof Renderer
         * @instance
         */
        this.destroy = function () {
            if (container !== undefined) {
                if (canvas !== undefined && container.contains(canvas)) {
                    container.removeChild(canvas);
                }
                if (world !== undefined && container.contains(world)) {
                    container.removeChild(world);
                }
            }
            if (gl) {
                // The spec says this is only supposed to simulate losing the WebGL
                // context, but in practice it tends to actually free the memory.
                var extension = gl.getExtension("WEBGL_lose_context");
                if (extension) {
                    extension.loseContext();
                }
            }
        };

        /**
         * Resize renderer (call after resizing container).
         * @memberof Renderer
         * @instance
         */
        this.resize = function () {
            var pixelRatio = window.devicePixelRatio || 1;
            canvas.width = canvas.clientWidth * pixelRatio;
            canvas.height = canvas.clientHeight * pixelRatio;
            if (gl) {
                if (gl.getError() == 1286) {
                    handleWebGLError1286();
                }
                gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
                if (imageType != "multires") {
                    gl.uniform1f(program.aspectRatio, canvas.clientWidth / canvas.clientHeight);
                } else if (image.shtHash) {
                    gl.useProgram(previewProgram);
                    gl.uniform1f(
                        previewProgram.aspectRatio,
                        canvas.clientWidth / canvas.clientHeight
                    );
                    gl.useProgram(program);
                }
            }
        };
        // Initialize canvas size
        if (canvas) {
            this.resize();
        }

        /**
         * Set renderer horizon pitch and roll.
         * @memberof Renderer
         * @instance
         * @param {number} horizonPitch - Pitch of horizon (in radians).
         * @param {number} horizonRoll - Roll of horizon (in radians).
         */
        this.setPose = function (horizonPitch, horizonRoll) {
            horizonPitch = isNaN(horizonPitch) ? 0 : Number(horizonPitch);
            horizonRoll = isNaN(horizonRoll) ? 0 : Number(horizonRoll);
            if (horizonPitch == 0 && horizonRoll == 0) {
                pose = undefined;
            } else {
                pose = [horizonPitch, horizonRoll];
            }
        };

        /**
         * Render new view of panorama.
         * @memberof Renderer
         * @instance
         * @param {number} pitch - Pitch to render at (in radians).
         * @param {number} yaw - Yaw to render at (in radians).
         * @param {number} hfov - Horizontal field of view to render with (in radians).
         * @param {Object} [params] - Extra configuration parameters.
         * @param {number} [params.roll] - Camera roll (in radians).
         * @param {string} [params.returnImage] - Return rendered image? If specified, should be 'ImageBitmap', 'image/jpeg', or 'image/png'.
         * @param {function} [params.hook] - Hook for executing arbitrary function in this environment.
         * @param {boolean} [params.dynamic] - Whether or not the image is dynamic (e.g., video) and should be updated.
         */
        this.render = function (pitch, yaw, hfov, params) {
            var focal,
                i,
                s,
                roll = 0;
            if (params === undefined) {
                params = {};
            }
            if (params.roll) {
                roll = params.roll;
            }
            if (params.dynamic) {
                var dynamic = params.dynamic;
            }

            // Apply pitch and roll transformation if applicable
            if (pose !== undefined) {
                var horizonPitch = pose[0],
                    horizonRoll = pose[1];

                // Calculate new pitch and yaw
                var orig_pitch = pitch,
                    orig_yaw = yaw,
                    x =
                        Math.cos(horizonRoll) * Math.sin(pitch) * Math.sin(horizonPitch) +
                        Math.cos(pitch) *
                            (Math.cos(horizonPitch) * Math.cos(yaw) +
                                Math.sin(horizonRoll) * Math.sin(horizonPitch) * Math.sin(yaw)),
                    y =
                        -Math.sin(pitch) * Math.sin(horizonRoll) +
                        Math.cos(pitch) * Math.cos(horizonRoll) * Math.sin(yaw),
                    z =
                        Math.cos(horizonRoll) * Math.cos(horizonPitch) * Math.sin(pitch) +
                        Math.cos(pitch) *
                            (-Math.cos(yaw) * Math.sin(horizonPitch) +
                                Math.cos(horizonPitch) * Math.sin(horizonRoll) * Math.sin(yaw));
                pitch = Math.asin(Math.max(Math.min(z, 1), -1));
                yaw = Math.atan2(y, x);

                // Calculate roll
                var v = [
                        Math.cos(orig_pitch) *
                            (Math.sin(horizonRoll) * Math.sin(horizonPitch) * Math.cos(orig_yaw) -
                                Math.cos(horizonPitch) * Math.sin(orig_yaw)),
                        Math.cos(orig_pitch) * Math.cos(horizonRoll) * Math.cos(orig_yaw),
                        Math.cos(orig_pitch) *
                            (Math.cos(horizonPitch) * Math.sin(horizonRoll) * Math.cos(orig_yaw) +
                                Math.sin(orig_yaw) * Math.sin(horizonPitch))
                    ],
                    w = [-Math.cos(pitch) * Math.sin(yaw), Math.cos(pitch) * Math.cos(yaw)];
                var roll_adj = Math.acos(
                    Math.max(
                        Math.min(
                            (v[0] * w[0] + v[1] * w[1]) /
                                (Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) *
                                    Math.sqrt(w[0] * w[0] + w[1] * w[1])),
                            1
                        ),
                        -1
                    )
                );
                if (v[2] < 0) {
                    roll_adj = 2 * Math.PI - roll_adj;
                }
                roll += roll_adj;
            }

            // Execute function hook
            if (params.hook) {
                params.hook({
                    gl: gl,
                    program: program,
                    previewProgram: previewProgram,
                    imageType: imageType,
                    texCoordBuffer: texCoordBuffer,
                    cubeVertBuf: cubeVertBuf,
                    cubeVertTexCoordBuf: cubeVertTexCoordBuf,
                    cubeVertIndBuf: cubeVertIndBuf
                });
            }

            // If no WebGL
            if (!gl && (imageType == "multires" || imageType == "cubemap")) {
                // Determine face transforms
                s = fallbackImgSize / 2;

                var transforms = {
                    f: "translate3d(-" + (s + 2) + "px, -" + (s + 2) + "px, -" + s + "px)",
                    b:
                        "translate3d(" +
                        (s + 2) +
                        "px, -" +
                        (s + 2) +
                        "px, " +
                        s +
                        "px) rotateX(180deg) rotateZ(180deg)",
                    u:
                        "translate3d(-" +
                        (s + 2) +
                        "px, -" +
                        s +
                        "px, " +
                        (s + 2) +
                        "px) rotateX(270deg)",
                    d:
                        "translate3d(-" +
                        (s + 2) +
                        "px, " +
                        s +
                        "px, -" +
                        (s + 2) +
                        "px) rotateX(90deg)",
                    l:
                        "translate3d(-" +
                        s +
                        "px, -" +
                        (s + 2) +
                        "px, " +
                        (s + 2) +
                        "px) rotateX(180deg) rotateY(90deg) rotateZ(180deg)",
                    r:
                        "translate3d(" +
                        s +
                        "px, -" +
                        (s + 2) +
                        "px, -" +
                        (s + 2) +
                        "px) rotateY(270deg)"
                };
                focal = 1 / Math.tan(hfov / 2);
                var zoom = (focal * canvas.clientWidth) / 2 + "px";
                var transform =
                    "perspective(" +
                    zoom +
                    ") translateZ(" +
                    zoom +
                    ") rotateX(" +
                    pitch +
                    "rad) rotateY(" +
                    yaw +
                    "rad) ";

                // Apply face transforms
                var faces = Object.keys(transforms);
                for (i = 0; i < 6; i++) {
                    var face = world.querySelector(".pnlm-" + faces[i] + "face");
                    if (!face) {
                        continue;
                    } // ignore missing face to support partial cubemap/fallback image
                    face.style.webkitTransform = transform + transforms[faces[i]];
                    face.style.transform = transform + transforms[faces[i]];
                }
                return;
            }

            if (imageType != "multires") {
                // Calculate focal length from vertical field of view
                var vfov =
                    2 *
                    Math.atan(
                        Math.tan(hfov * 0.5) / (gl.drawingBufferWidth / gl.drawingBufferHeight)
                    );
                focal = 1 / Math.tan(vfov * 0.5);

                // Pass psi, theta, roll, and focal length
                gl.uniform1f(program.psi, yaw);
                gl.uniform1f(program.theta, pitch);
                gl.uniform1f(program.rot, roll);
                gl.uniform1f(program.f, focal);

                if (dynamic === true) {
                    // Update texture if dynamic
                    if (imageType == "equirectangular") {
                        gl.bindTexture(gl.TEXTURE_2D, program.texture);
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
                    }
                }

                // Draw using current buffer
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            } else {
                // Draw SHT hash preview, if needed
                var isPreview =
                    typeof image.shtHash !== "undefined" ||
                    typeof image.equirectangularThumbnail !== "undefined";
                var drawPreview = isPreview;
                if (isPreview && program.currentNodes.length >= 6) {
                    drawPreview = false;
                    for (var i = 0; i < 6; i++) {
                        if (!program.currentNodes[i].textureLoaded) {
                            drawPreview = true;
                            break;
                        }
                    }
                }
                if (drawPreview) {
                    gl.useProgram(previewProgram);
                    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
                    gl.vertexAttribPointer(
                        previewProgram.texCoordLocation,
                        2,
                        gl.FLOAT,
                        false,
                        0,
                        0
                    );
                    gl.bindTexture(gl.TEXTURE_2D, previewProgram.texture);

                    // Calculate focal length from vertical field of view
                    var vfov =
                        2 *
                        Math.atan(
                            Math.tan(hfov * 0.5) / (gl.drawingBufferWidth / gl.drawingBufferHeight)
                        );
                    focal = 1 / Math.tan(vfov * 0.5);

                    // Pass psi, theta, roll, and focal length
                    gl.uniform1f(previewProgram.psi, yaw);
                    gl.uniform1f(previewProgram.theta, pitch);
                    gl.uniform1f(previewProgram.rot, roll);
                    gl.uniform1f(previewProgram.f, focal);

                    // Draw using current buffer
                    gl.drawArrays(gl.TRIANGLES, 0, 6);

                    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertBuf);
                    gl.vertexAttribPointer(program.vertPosLocation, 3, gl.FLOAT, false, 0, 0);
                    gl.useProgram(program);
                }

                // Create perspective matrix
                var perspMatrix = makePersp(
                    hfov,
                    gl.drawingBufferWidth / gl.drawingBufferHeight,
                    0.1,
                    100.0
                );
                var perspMatrixNoClip = makePersp(
                    hfov,
                    gl.drawingBufferWidth / gl.drawingBufferHeight,
                    -100.0,
                    100.0
                );

                // Create rotation matrix
                var matrix = identityMatrix3();
                matrix = rotateMatrix(matrix, -roll, "z");
                matrix = rotateMatrix(matrix, -pitch, "x");
                matrix = rotateMatrix(matrix, yaw, "y");
                matrix = makeMatrix4(matrix);

                // Set matrix uniforms
                gl.uniformMatrix4fv(program.perspUniform, false, transposeMatrix4(perspMatrix));
                gl.uniformMatrix4fv(program.cubeUniform, false, transposeMatrix4(matrix));

                // Find current nodes
                var rotPersp = rotatePersp(perspMatrix, matrix);
                var rotPerspNoClip = rotatePersp(perspMatrixNoClip, matrix);
                program.nodeCache.sort(multiresNodeSort);
                if (
                    program.nodeCache.length > 200 &&
                    program.nodeCache.length > program.currentNodes.length + 50
                ) {
                    // Remove older nodes from cache
                    var removed = program.nodeCache.splice(200, program.nodeCache.length - 200);
                    for (var j = 0; j < removed.length; j++) {
                        // Explicitly delete textures
                        gl.deleteTexture(removed[j].texture);
                    }
                }
                program.currentNodes = [];

                for (s = 0; s < 6; s++) {
                    var ntmp = new MultiresNode(vtmps[s], sides[s], 1, 0, 0, image.fullpath, null);
                    testMultiresNode(rotPersp, rotPerspNoClip, ntmp, pitch, yaw, hfov);
                }

                program.currentNodes.sort(multiresNodeRenderSort);

                // Unqueue any pending requests for nodes that are no longer visible
                for (i = pendingTextureRequests.length - 1; i >= 0; i--) {
                    if (program.currentNodes.indexOf(pendingTextureRequests[i].node) === -1) {
                        pendingTextureRequests[i].node.textureLoad = false;
                        pendingTextureRequests.splice(i, 1);
                    }
                }

                // Allow one request to be pending, so that we can create a texture buffer for that in advance of loading actually beginning
                if (pendingTextureRequests.length === 0) {
                    for (i = 0; i < program.currentNodes.length; i++) {
                        var node = program.currentNodes[i];
                        if (!node.texture && !node.textureLoad) {
                            node.textureLoad = true;

                            setTimeout(processNextTile, 0, node);

                            // Only process one tile per frame to improve responsiveness
                            break;
                        }
                    }
                }

                // Process one pending image tile
                // This is synchronized to rendering to avoid dropping frames due
                // to texture loading happening at an inopportune time.
                if (program.textureLoads.length > 0) {
                    program.textureLoads.shift()(true);
                }

                // Draw tiles
                multiresDraw(!isPreview);
            }

            if (params.returnImage !== undefined) {
                if (window.createImageBitmap && params.returnImage == "ImageBitmap") {
                    return createImageBitmap(canvas);
                } else {
                    if (params.returnImage.toString().indexOf("image/") == 0) {
                        return canvas.toDataURL(params.returnImage);
                    } else {
                        return canvas.toDataURL("image/png");
                    } // Old default
                }
            }
        };

        /**
         * Check if images are loading.
         * @memberof Renderer
         * @instance
         * @returns {boolean} Whether or not images are loading.
         */
        this.isLoading = function () {
            if (gl && imageType == "multires") {
                for (var i = 0; i < program.currentNodes.length; i++) {
                    if (!program.currentNodes[i].textureLoaded) {
                        return true;
                    }
                }
            }
            return false;
        };

        /**
         * Check if base image tiles are loaded.
         * @memberof Renderer
         * @instance
         * @returns {boolean} Whether or not base image tiles are loaded.
         */
        this.isBaseLoaded = function () {
            if (program.currentNodes.length >= 6) {
                for (var i = 0; i < 6; i++) {
                    if (!program.currentNodes[i].textureLoaded) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        };

        /**
         * Retrieve renderer's canvas.
         * @memberof Renderer
         * @instance
         * @returns {HTMLElement} Renderer's canvas.
         */
        this.getCanvas = function () {
            return canvas;
        };

        /**
         * Sorting method for multires nodes.
         * @private
         * @param {MultiresNode} a - First node.
         * @param {MultiresNode} b - Second node.
         * @returns {number} Base tiles first, then higher timestamp first.
         */
        function multiresNodeSort(a, b) {
            // Base tiles are always first
            if (a.level == 1 && b.level != 1) {
                return -1;
            }
            if (b.level == 1 && a.level != 1) {
                return 1;
            }

            // Higher timestamp first
            return b.timestamp - a.timestamp;
        }

        /**
         * Sorting method for multires node rendering.
         * @private
         * @param {MultiresNode} a - First node.
         * @param {MultiresNode} b - Second node.
         * @returns {number} Lower zoom levels first, then closest to center first.
         */
        function multiresNodeRenderSort(a, b) {
            // Lower zoom levels first
            if (a.level != b.level) {
                return a.level - b.level;
            }

            // Lower distance from center first
            return a.diff - b.diff;
        }

        /**
         * Draws multires nodes.
         * @param {bool} clear - Whether or not to clear canvas.
         * @private
         */
        function multiresDraw(clear) {
            if (!program.drawInProgress) {
                program.drawInProgress = true;
                // Clear canvas
                if (clear) {
                    gl.clear(gl.COLOR_BUFFER_BIT);
                }

                // Determine tiles that need to be drawn
                var node_paths = {};
                for (var i = 0; i < program.currentNodes.length; i++) {
                    if (node_paths[program.currentNodes[i].parentPath] === undefined) {
                        node_paths[program.currentNodes[i].parentPath] = 0;
                    }
                    node_paths[program.currentNodes[i].parentPath] +=
                        program.currentNodes[i].textureLoaded > 1;
                }
                // Draw tiles
                for (var i = 0; i < program.currentNodes.length; i++) {
                    // This optimization doesn't draw a node if all its children
                    // will be drawn
                    if (
                        program.currentNodes[i].textureLoaded > 1 &&
                        node_paths[program.currentNodes[i].path] !=
                            program.currentNodes[i].numChildren
                    ) {
                        //var color = program.currentNodes[i].color;
                        //gl.uniform4f(program.colorUniform, color[0], color[1], color[2], 1.0);

                        // Pass vertices to WebGL
                        gl.bufferData(
                            gl.ARRAY_BUFFER,
                            program.currentNodes[i].vertices,
                            gl.STATIC_DRAW
                        );

                        // Bind texture and draw tile
                        gl.bindTexture(gl.TEXTURE_2D, program.currentNodes[i].texture); // Bind program.currentNodes[i].texture to TEXTURE0
                        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
                    }
                }
                program.drawInProgress = false;
            }
        }

        /**
         * Creates new multires node.
         * @constructor
         * @private
         * @param {Float32Array} vertices - Node's vertices.
         * @param {string} side - Node's cube face.
         * @param {number} level - Node's zoom level.
         * @param {number} x - Node's x position.
         * @param {number} y - Node's y position.
         * @param {string} path - Node's path.
         * @param {string} parentPath - Node parent's path.
         */
        function MultiresNode(vertices, side, level, x, y, path, parentPath) {
            this.vertices = vertices;
            this.side = side;
            this.level = level;
            this.x = x;
            this.y = y;
            // Use tile key if paths need to be looked up in a dictionary, which needs a `tileKey` entry
            var p = typeof path === "object" ? path.tileKey : path;
            p = p
                .replace("%s", side)
                .replace("%l0", level - 1)
                .replace("%l", level)
                .replace("%x", x)
                .replace("%y", y);
            this.path = typeof path === "object" ? path[p] : p;
            this.parentPath = parentPath;
        }

        /**
         * Test if multires node is visible. If it is, add it to current nodes,
         * load its texture, and load appropriate child nodes.
         * @private
         * @param {number[]} rotPersp - Rotated perspective matrix.
         * @param {number[]} rotPersp - Rotated perspective matrix without clipping behind camera.
         * @param {MultiresNode} node - Multires node to check.
         * @param {number} pitch - Pitch to check at.
         * @param {number} yaw - Yaw to check at.
         * @param {number} hfov - Horizontal field of view to check at.
         */
        function testMultiresNode(rotPersp, rotPerspNoClip, node, pitch, yaw, hfov) {
            // Don't try to load missing tiles (I wish there were a better way to check than `toString`)
            if (
                image.missingTileList !== undefined &&
                image.missingTileList.indexOf([node.side, node.level, node.x, node.y].toString()) >=
                    0
            ) {
                return;
            }

            if (checkSquareInView(rotPersp, node.vertices)) {
                // In order to determine if this tile resolution needs to be loaded
                // for this node, start by calculating positions of node corners
                // and checking if they're in view
                var cornersWinX = [],
                    cornersWinY = [],
                    minCornersWinZ = 2,
                    cornersInView = [],
                    numCornersInView = 0;
                for (var i = 0; i < 4; i++) {
                    var corner = applyRotPerspToVec(
                        rotPerspNoClip,
                        node.vertices.slice(i * 3, (i + 1) * 3)
                    );
                    cornersWinX.push(corner[0] * corner[3]);
                    cornersWinY.push(corner[1] * corner[3]);
                    var cornerWinZ = corner[2] * corner[3];
                    minCornersWinZ = Math.min(minCornersWinZ, cornerWinZ);
                    cornersInView.push(
                        Math.abs(cornersWinX[i]) <= 1 &&
                            Math.abs(cornersWinY[i]) <= 1 &&
                            cornerWinZ > 0
                    );
                    numCornersInView += cornersInView[i];
                }

                var cubeSize = image.cubeResolution * Math.pow(2, node.level - image.maxLevel);
                var numTiles = Math.ceil(cubeSize * image.invTileResolution) - 1;
                var doubleTileSize = (cubeSize % image.tileResolution) * 2;
                var lastTileSize = (cubeSize * 2) % image.tileResolution;
                if (lastTileSize === 0) {
                    lastTileSize = image.tileResolution;
                }
                if (doubleTileSize === 0) {
                    doubleTileSize = image.tileResolution * 2;
                }

                // Tiles should always be loaded if they're base tiles, in the
                // extremely-wide FOV edge case when a node corner is behind the
                // camera, and when no node corners are in the viewport. In other
                // cases, additional checks are required.
                if (node.level > 1 && minCornersWinZ > 0 && numCornersInView > 0) {
                    // Calculate length of node sides that are at least partly in view
                    var maxSide = 0;
                    for (var i = 0; i < 4; i++) {
                        var j = (i + 1) % 4;
                        if (cornersInView[i] || cornersInView[j]) {
                            var diffX =
                                    ((cornersWinX[j] - cornersWinX[i]) * gl.drawingBufferWidth) / 2,
                                diffY =
                                    ((cornersWinY[j] - cornersWinY[i]) * gl.drawingBufferHeight) /
                                    2;
                            // Handle edge tiles
                            if (lastTileSize < image.tileResolution) {
                                if (node.x == numTiles) {
                                    diffX *= image.tileResolution / lastTileSize;
                                } else if (node.y == numTiles) {
                                    diffY *= image.tileResolution / lastTileSize;
                                }
                            }
                            // Handle small tiles that have fewer than four children
                            if (doubleTileSize <= image.tileResolution) {
                                if (node.x == numTiles) {
                                    diffX *= 2;
                                }
                                if (node.y == numTiles) {
                                    diffY *= 2;
                                }
                            }
                            maxSide = Math.max(maxSide, Math.sqrt(diffX * diffX + diffY * diffY));
                        }
                    }
                    // Don't load tile if the largest node side is smaller than
                    // half the tile resolution, since the parent node is smaller
                    // than the parent tile in this case
                    if (maxSide <= image.tileResolution / 2) {
                        return;
                    }
                }

                // Calculate central angle between center of view and center of tile
                var v = node.vertices;
                var x = v[0] + v[3] + v[6] + v[9];
                var y = v[1] + v[4] + v[7] + v[10];
                var z = v[2] + v[5] + v[8] + v[11];
                var r = Math.sqrt(x * x + y * y + z * z);
                var theta = Math.asin(z / r);
                var phi = Math.atan2(y, x);
                var ydiff = phi - yaw;
                ydiff += ydiff > Math.PI ? -2 * Math.PI : ydiff < -Math.PI ? 2 * Math.PI : 0;
                ydiff = Math.abs(ydiff);
                node.diff = Math.acos(
                    Math.sin(pitch) * Math.sin(theta) +
                        Math.cos(pitch) * Math.cos(theta) * Math.cos(ydiff)
                );

                // Add node to current nodes and load texture if needed
                var inCurrent = false;
                for (var k = 0; k < program.nodeCache.length; k++) {
                    if (program.nodeCache[k].path == node.path) {
                        inCurrent = true;
                        program.nodeCache[k].timestamp = program.nodeCacheTimestamp++;
                        program.nodeCache[k].diff = node.diff;
                        program.currentNodes.push(program.nodeCache[k]);
                        break;
                    }
                }
                if (!inCurrent) {
                    //node.color = [Math.random(), Math.random(), Math.random()];
                    node.timestamp = program.nodeCacheTimestamp++;
                    program.currentNodes.push(node);
                    program.nodeCache.push(node);
                }

                // Create child nodes
                if (node.level < image.maxLevel) {
                    var f = 0.5;
                    if (node.x == numTiles || node.y == numTiles) {
                        f = 1.0 - image.tileResolution / (image.tileResolution + lastTileSize);
                    }
                    var i = 1.0 - f;
                    var children = [];
                    var vtmp, ntmp;
                    var f1 = f,
                        f2 = f,
                        f3 = f,
                        i1 = i,
                        i2 = i,
                        i3 = i;
                    // Handle non-symmetric tiles
                    if (lastTileSize < image.tileResolution) {
                        if (node.x == numTiles && node.y != numTiles) {
                            f2 = 0.5;
                            i2 = 0.5;
                            if (node.side == "d" || node.side == "u") {
                                f3 = 0.5;
                                i3 = 0.5;
                            }
                        } else if (node.x != numTiles && node.y == numTiles) {
                            f1 = 0.5;
                            i1 = 0.5;
                            if (node.side == "l" || node.side == "r") {
                                f3 = 0.5;
                                i3 = 0.5;
                            }
                        }
                    }
                    // Handle small tiles that have fewer than four children
                    if (doubleTileSize <= image.tileResolution) {
                        if (node.x == numTiles) {
                            f1 = 0;
                            i1 = 1;
                            if (node.side == "l" || node.side == "r") {
                                f3 = 0;
                                i3 = 1;
                            }
                            node.numChildren = 2;
                        }
                        if (node.y == numTiles) {
                            f2 = 0;
                            i2 = 1;
                            if (node.side == "d" || node.side == "u") {
                                f3 = 0;
                                i3 = 1;
                            }
                            node.numChildren = 2;
                        }
                        if (node.x == numTiles && node.y == numTiles) {
                            node.numChildren = 1;
                        }
                    } else {
                        node.numChildren = 4;
                    }

                    vtmp = new Float32Array([
                        v[0],
                        v[1],
                        v[2],
                        v[0] * f1 + v[3] * i1,
                        v[1] * f + v[4] * i,
                        v[2] * f3 + v[5] * i3,
                        v[0] * f1 + v[6] * i1,
                        v[1] * f2 + v[7] * i2,
                        v[2] * f3 + v[8] * i3,
                        v[0] * f + v[9] * i,
                        v[1] * f2 + v[10] * i2,
                        v[2] * f3 + v[11] * i3
                    ]);
                    ntmp = new MultiresNode(
                        vtmp,
                        node.side,
                        node.level + 1,
                        node.x * 2,
                        node.y * 2,
                        image.fullpath,
                        node.path
                    );
                    children.push(ntmp);
                    if (!(node.x == numTiles && doubleTileSize <= image.tileResolution)) {
                        vtmp = new Float32Array([
                            v[0] * f1 + v[3] * i1,
                            v[1] * f + v[4] * i,
                            v[2] * f3 + v[5] * i3,
                            v[3],
                            v[4],
                            v[5],
                            v[3] * f + v[6] * i,
                            v[4] * f2 + v[7] * i2,
                            v[5] * f3 + v[8] * i3,
                            v[0] * f1 + v[6] * i1,
                            v[1] * f2 + v[7] * i2,
                            v[2] * f3 + v[8] * i3
                        ]);
                        ntmp = new MultiresNode(
                            vtmp,
                            node.side,
                            node.level + 1,
                            node.x * 2 + 1,
                            node.y * 2,
                            image.fullpath,
                            node.path
                        );
                        children.push(ntmp);
                    }
                    if (
                        !(node.x == numTiles && doubleTileSize <= image.tileResolution) &&
                        !(node.y == numTiles && doubleTileSize <= image.tileResolution)
                    ) {
                        vtmp = new Float32Array([
                            v[0] * f1 + v[6] * i1,
                            v[1] * f2 + v[7] * i2,
                            v[2] * f3 + v[8] * i3,
                            v[3] * f + v[6] * i,
                            v[4] * f2 + v[7] * i2,
                            v[5] * f3 + v[8] * i3,
                            v[6],
                            v[7],
                            v[8],
                            v[9] * f1 + v[6] * i1,
                            v[10] * f + v[7] * i,
                            v[11] * f3 + v[8] * i3
                        ]);
                        ntmp = new MultiresNode(
                            vtmp,
                            node.side,
                            node.level + 1,
                            node.x * 2 + 1,
                            node.y * 2 + 1,
                            image.fullpath,
                            node.path
                        );
                        children.push(ntmp);
                    }
                    if (!(node.y == numTiles && doubleTileSize <= image.tileResolution)) {
                        vtmp = new Float32Array([
                            v[0] * f + v[9] * i,
                            v[1] * f2 + v[10] * i2,
                            v[2] * f3 + v[11] * i3,
                            v[0] * f1 + v[6] * i1,
                            v[1] * f2 + v[7] * i2,
                            v[2] * f3 + v[8] * i3,
                            v[9] * f1 + v[6] * i1,
                            v[10] * f + v[7] * i,
                            v[11] * f3 + v[8] * i3,
                            v[9],
                            v[10],
                            v[11]
                        ]);
                        ntmp = new MultiresNode(
                            vtmp,
                            node.side,
                            node.level + 1,
                            node.x * 2,
                            node.y * 2 + 1,
                            image.fullpath,
                            node.path
                        );
                        children.push(ntmp);
                    }
                    for (var j = 0; j < children.length; j++) {
                        testMultiresNode(rotPersp, rotPerspNoClip, children[j], pitch, yaw, hfov);
                    }
                } else {
                    node.numChildren = 0;
                }
            }
        }

        /**
         * Creates cube vertex array.
         * @private
         * @returns {Float32Array} Cube vertex array.
         */
        function createCube() {
            return new Float32Array([
                -1,
                1,
                -1,
                1,
                1,
                -1,
                1,
                -1,
                -1,
                -1,
                -1,
                -1, // Front face
                1,
                1,
                1,
                -1,
                1,
                1,
                -1,
                -1,
                1,
                1,
                -1,
                1, // Back face
                -1,
                1,
                1,
                1,
                1,
                1,
                1,
                1,
                -1,
                -1,
                1,
                -1, // Up face
                -1,
                -1,
                -1,
                1,
                -1,
                -1,
                1,
                -1,
                1,
                -1,
                -1,
                1, // Down face
                -1,
                1,
                1,
                -1,
                1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                1, // Left face
                1,
                1,
                -1,
                1,
                1,
                1,
                1,
                -1,
                1,
                1,
                -1,
                -1 // Right face
            ]);
        }

        /**
         * Creates 3x3 identity matrix.
         * @private
         * @returns {Float32Array} Identity matrix.
         */
        function identityMatrix3() {
            return new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
        }

        /**
         * Rotates a 3x3 matrix.
         * @private
         * @param {number[]} m - Matrix to rotate.
         * @param {number[]} angle - Angle to rotate by in radians.
         * @param {string} axis - Axis to rotate about (`x`, `y`, or `z`).
         * @returns {Float32Array} Rotated matrix.
         */
        function rotateMatrix(m, angle, axis) {
            var s = Math.sin(angle);
            var c = Math.cos(angle);
            if (axis == "x") {
                return new Float32Array([
                    m[0],
                    c * m[1] + s * m[2],
                    c * m[2] - s * m[1],
                    m[3],
                    c * m[4] + s * m[5],
                    c * m[5] - s * m[4],
                    m[6],
                    c * m[7] + s * m[8],
                    c * m[8] - s * m[7]
                ]);
            }
            if (axis == "y") {
                return new Float32Array([
                    c * m[0] - s * m[2],
                    m[1],
                    c * m[2] + s * m[0],
                    c * m[3] - s * m[5],
                    m[4],
                    c * m[5] + s * m[3],
                    c * m[6] - s * m[8],
                    m[7],
                    c * m[8] + s * m[6]
                ]);
            }
            if (axis == "z") {
                return new Float32Array([
                    c * m[0] + s * m[1],
                    c * m[1] - s * m[0],
                    m[2],
                    c * m[3] + s * m[4],
                    c * m[4] - s * m[3],
                    m[5],
                    c * m[6] + s * m[7],
                    c * m[7] - s * m[6],
                    m[8]
                ]);
            }
        }

        /**
         * Turns a 3x3 matrix into a 4x4 matrix.
         * @private
         * @param {number[]} m - Input matrix.
         * @returns {Float32Array} Expanded matrix.
         */
        function makeMatrix4(m) {
            return new Float32Array([
                m[0],
                m[1],
                m[2],
                0,
                m[3],
                m[4],
                m[5],
                0,
                m[6],
                m[7],
                m[8],
                0,
                0,
                0,
                0,
                1
            ]);
        }

        /**
         * Transposes a 4x4 matrix.
         * @private
         * @param {number[]} m - Input matrix.
         * @returns {Float32Array} Transposed matrix.
         */
        function transposeMatrix4(m) {
            return new Float32Array([
                m[0],
                m[4],
                m[8],
                m[12],
                m[1],
                m[5],
                m[9],
                m[13],
                m[2],
                m[6],
                m[10],
                m[14],
                m[3],
                m[7],
                m[11],
                m[15]
            ]);
        }

        /**
         * Creates a perspective matrix.
         * @private
         * @param {number} hfov - Desired horizontal field of view.
         * @param {number} aspect - Desired aspect ratio.
         * @param {number} znear - Near distance.
         * @param {number} zfar - Far distance.
         * @returns {Float32Array} Generated perspective matrix.
         */
        function makePersp(hfov, aspect, znear, zfar) {
            var fovy =
                2 *
                Math.atan((Math.tan(hfov / 2) * gl.drawingBufferHeight) / gl.drawingBufferWidth);
            var f = 1 / Math.tan(fovy / 2);
            return new Float32Array([
                f / aspect,
                0,
                0,
                0,
                0,
                f,
                0,
                0,
                0,
                0,
                (zfar + znear) / (znear - zfar),
                (2 * zfar * znear) / (znear - zfar),
                0,
                0,
                -1,
                0
            ]);
        }

        /**
         * Processes a loaded texture image into a WebGL texture.
         * @private
         * @param {Image} img - Input image.
         * @param {WebGLTexture} tex - Texture to bind image to.
         */
        function processLoadedTexture(img, tex) {
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.bindTexture(gl.TEXTURE_2D, null);
        }

        var pendingTextureRequests = [];

        // Based on http://blog.tojicode.com/2012/03/javascript-memory-optimization-and.html
        var loadTexture = (function () {
            var cacheTop = 4; // Maximum number of concurrent loads
            var textureImageCache = {};
            var crossOrigin;
            function TextureImageLoader() {
                var self = this;
                this.texture = this.callback = null;
                this.image = new Image();
                this.image.crossOrigin = crossOrigin ? crossOrigin : "anonymous";
                var loadFn = function () {
                    program.textureLoads.push(function (execute) {
                        if (execute) {
                            if (self.image.width > 0 && self.image.height > 0) {
                                // Ignore missing tile to support partial image
                                processLoadedTexture(self.image, self.texture);
                                self.callback(self.texture, true);
                            } else {
                                self.callback(self.texture, false);
                            }
                        }
                        releaseTextureImageLoader(self);
                    });
                };
                this.image.addEventListener("load", loadFn);
                this.image.addEventListener("error", loadFn); // Ignore missing tile file to support partial image; otherwise retry loop causes high CPU load
            }

            TextureImageLoader.prototype.loadTexture = function (src, texture, callback) {
                this.texture = texture;
                this.callback = callback;
                this.image.src = src;
            };

            function PendingTextureRequest(node, src, texture, callback) {
                this.node = node;
                this.src = src;
                this.texture = texture;
                this.callback = callback;
            }

            function releaseTextureImageLoader(til) {
                if (pendingTextureRequests.length) {
                    var req = pendingTextureRequests.shift();
                    til.loadTexture(req.src, req.texture, req.callback);
                } else {
                    textureImageCache[cacheTop++] = til;
                }
            }

            for (var i = 0; i < cacheTop; i++) {
                textureImageCache[i] = new TextureImageLoader();
            }

            return function (node, src, callback, _crossOrigin) {
                crossOrigin = _crossOrigin;
                var texture = gl.createTexture();
                if (cacheTop) {
                    textureImageCache[--cacheTop].loadTexture(src, texture, callback);
                } else {
                    pendingTextureRequests.push(
                        new PendingTextureRequest(node, src, texture, callback)
                    );
                }
                return texture;
            };
        })();

        /**
         * Loads image and creates texture for a multires node / tile.
         * @private
         * @param {MultiresNode} node - Input node.
         */
        function processNextTileFallback(node) {
            loadTexture(
                node,
                node.path + (image.extension ? "." + image.extension : ""),
                function (texture, loaded) {
                    node.texture = texture;
                    node.textureLoaded = loaded ? 2 : 1;
                },
                globalParams.crossOrigin
            );
        }

        // Load images in separate thread when possible
        var processNextTile;
        if (window.Worker && window.createImageBitmap) {
            function workerFunc() {
                self.onmessage = function (e) {
                    var path = e.data[0],
                        crossOrigin = e.data[1];
                    fetch(path, {
                        mode: "cors",
                        credentials: crossOrigin == "use-credentials" ? "include" : "same-origin"
                    })
                        .then(function (response) {
                            return response.blob();
                        })
                        .then(function (blob) {
                            return createImageBitmap(blob);
                        })
                        .then(function (bitmap) {
                            postMessage([path, true, bitmap], [bitmap]);
                        })
                        .catch(function () {
                            postMessage([path, false]);
                        });
                };
            }
            var workerFuncBlob = new Blob(["(" + workerFunc.toString() + ")()"], {
                    type: "application/javascript"
                }),
                worker = new Worker(URL.createObjectURL(workerFuncBlob)),
                texturesLoading = {};
            worker.onmessage = function (e) {
                var path = e.data[0],
                    success = e.data[1],
                    bitmap = e.data[2];
                program.textureLoads.push(function (execute) {
                    var texture,
                        loaded = false;
                    if (success && execute) {
                        // Ignore missing tile to support partial image
                        texture = gl.createTexture();
                        processLoadedTexture(bitmap, texture);
                        loaded = true;
                    }
                    var node = texturesLoading[path];
                    delete texturesLoading[path];
                    if (node !== undefined) {
                        node.texture = texture;
                        node.textureLoaded = loaded ? 2 : 1;
                    }
                });
            };
            processNextTile = function (node) {
                // Since web worker is created from a Blob, we need the absolute URL
                var path = new URL(
                    node.path + (image.extension ? "." + image.extension : ""),
                    window.location
                ).href;
                texturesLoading[path] = node;
                worker.postMessage([path, globalParams.crossOrigin]);
            };
        } else {
            processNextTile = processNextTileFallback;
        }

        /**
         * Rotates perspective matrix.
         * @private
         * @param {number[]} p - Perspective matrix.
         * @param {number[]} r - Rotation matrix.
         * @returns {Float32Array} Rotated matrix.
         */
        function rotatePersp(p, r) {
            return new Float32Array([
                p[0] * r[0],
                p[0] * r[1],
                p[0] * r[2],
                0,
                p[5] * r[4],
                p[5] * r[5],
                p[5] * r[6],
                0,
                p[10] * r[8],
                p[10] * r[9],
                p[10] * r[10],
                p[11],
                -r[8],
                -r[9],
                -r[10],
                0
            ]);
        }

        /**
         * Applies rotated perspective matrix to a 3-vector
         * (last element is inverted).
         * @private
         * @param {number[]} m - Rotated perspective matrix.
         * @param {number[]} v - Input 3-vector.
         * @returns {Float32Array} Resulting 4-vector.
         */
        function applyRotPerspToVec(m, v) {
            return new Float32Array([
                m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
                m[4] * v[0] + m[5] * v[1] + m[6] * v[2],
                m[11] + m[8] * v[0] + m[9] * v[1] + m[10] * v[2],
                1 / (m[12] * v[0] + m[13] * v[1] + m[14] * v[2])
            ]);
        }

        /**
         * Checks if a vertex is visible.
         * @private
         * @param {number[]} m - Rotated perspective matrix.
         * @param {number[]} v - Input vertex.
         * @returns {number} 1 or -1 if the vertex is or is not visible,
         *      respectively.
         */
        function checkInView(m, v) {
            var vpp = applyRotPerspToVec(m, v);
            var winX = vpp[0] * vpp[3];
            var winY = vpp[1] * vpp[3];
            var winZ = vpp[2] * vpp[3];
            var ret = [0, 0, 0];

            if (winX < -1) {
                ret[0] = -1;
            }
            if (winX > 1) {
                ret[0] = 1;
            }
            if (winY < -1) {
                ret[1] = -1;
            }
            if (winY > 1) {
                ret[1] = 1;
            }
            if (winZ < -1 || winZ > 1) {
                ret[2] = 1;
            }
            return ret;
        }

        /**
         * Checks if a square (tile) is visible.
         * @private
         * @param {number[]} m - Rotated perspective matrix.
         * @param {number[]} v - Square's vertex array.
         * @returns {boolean} Whether or not the square is visible.
         */
        function checkSquareInView(m, v) {
            var check1 = checkInView(m, v.slice(0, 3));
            var check2 = checkInView(m, v.slice(3, 6));
            var check3 = checkInView(m, v.slice(6, 9));
            var check4 = checkInView(m, v.slice(9, 12));
            var testX = check1[0] + check2[0] + check3[0] + check4[0];
            if (testX == -4 || testX == 4) {
                return false;
            }
            var testY = check1[1] + check2[1] + check3[1] + check4[1];
            if (testY == -4 || testY == 4) {
                return false;
            }
            var testZ = check1[2] + check2[2] + check3[2] + check4[2];
            return testZ != 4;
        }

        /**
         * On iOS (iPhone 5c, iOS 10.3), this WebGL error occurs when the canvas is
         * too big. Unfortunately, there's no way to test for this beforehand, so we
         * reduce the canvas size if this error is thrown.
         * @private
         */
        function handleWebGLError1286() {
            console.log("Reducing canvas size due to error 1286!");
            canvas.width = Math.round(canvas.width / 2);
            canvas.height = Math.round(canvas.height / 2);
        }

        // Data for rendering SHT hashes
        var shtB83chars =
                "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~",
            shtYlmStr =
                "Bf[ff4fff|ffff0fffffBo@Ri5xag{Jmdf2+WiefCs@Ll7+Vi]Btag6" +
                "[NmdgCv=Ho9;Qk;7zWiF_GsahDy:ErE?Mn$5+SkS_AyWiD#-CuJ[Iqp6;Nnx?7*SlE$" +
                "*BxR@FtPA?Jq+%7:NnF*zAzn?CwIG@Ft-Y9?IrG+vA%w:AzGR?Cx*IF@EuI,nA+$*9%" +
                "Gu:A#xCR?ByJ-VB-*wA+J**9*ZBv:9%L.QD.*aB.O.v9-MF+$8,O:MG:*OD;a:UB:IO" +
                ":n9:Q:KJ;#IG=u-KE=Hs:MC?T:IO=wEL?#%FJ@K**FI@Y;HV=pDU?*sCS@S.uCR[m;H" +
                "p=VDq?*SCs@s.QCt[r:Iw=OEz?#IF$@#*HF%@u:K$;KI+=uEK-=*sCM:?w:M+:HO.;a" +
                "CU;:%OCn?:z.Q..Ha;.ODv?-yFG$@,$-V;-Hw=+JH*?*lBP:?%%,n=+J*?%GQ:=#NCt" +
                "?;y++v=%O:=zGt?:xHI,@-u,*z=zX?:wI+@,tEY??%r-$*;xt@,tP=?$qG%[:xn.#-:" +
                "u$[%qp];xnN?[*sl.y:-r-?yn$^+sks_=yoi:v=*o?;uk;[zoi,_+skh:s@zl[+pi];" +
                "tkg][xmhg;o@ti^xkg{$mhf|+oigf;f[ff_fff|ffff~fffff",
            shtMaxYlm = 3.317,
            shtYlm = [];

        /**
         * Decodes an integer-encoded float.
         * @private
         * @param {number} i - Integer-encoded float.
         * @param {number} maxVal - Maximum value of decoded float.
         * @returns {number} Decoded float.
         */
        function shtDecodeFloat(i, maxVal) {
            return Math.pow((Math.abs(i) - maxVal) / maxVal, 2) * (i - maxVal > 0 ? 1 : -1);
        }

        /**
         * Decodes encoded spherical harmonic transform coefficients.
         * @private
         * @param {number} val - Encoded coefficient.
         * @param {number} maxVal - Maximum value of coefficients.
         * @returns {number[]} Decoded coefficients; one per color channel [r, g, b].
         */
        function shtDecodeCoeff(val, maxVal) {
            var quantR = Math.floor(val / (19 * 19)),
                quantG = Math.floor(val / 19) % 19,
                quantB = val % 19;
            var r = shtDecodeFloat(quantR, 9) * maxVal,
                g = shtDecodeFloat(quantG, 9) * maxVal,
                b = shtDecodeFloat(quantB, 9) * maxVal;
            return [r, g, b];
        }

        /**
         * Decodes base83-encoded string to integers.
         * @private
         * @param {string} b83str - Encoded string.
         * @param {number} length - Number of characters per integer.
         * @returns {number[]} Decoded integers.
         */
        function shtB83decode(b83str, length) {
            var cnt = Math.floor(b83str.length / length),
                vals = [];
            for (var i = 0; i < cnt; i++) {
                var val = 0;
                for (var j = 0; j < length; j++) {
                    val = val * 83 + shtB83chars.indexOf(b83str[i * length + j]);
                }
                vals.push(val);
            }
            return vals;
        }

        /**
         * Renders pixel from spherical harmonic transform coefficients.
         * @private
         * @param {number[]} flm - Real spherical harmonic transform coefficients.
         * @param {number[]} Ylm - 4pi-normalized spherical harmonics evaluated for ell, m, and lat.
         * @param {number} lon - Longitude (radians).
         * @returns {number} Pixel value.
         */
        function shtFlm2pixel(flm, Ylm, lon) {
            var lmax = Math.floor(Math.sqrt(flm.length)) - 1;

            // Precalculate sine and cosine coefficients
            var cosm = Array(lmax + 1),
                sinm = Array(lmax + 1);
            sinm[0] = 0;
            cosm[0] = 1;
            sinm[1] = Math.sin(lon);
            cosm[1] = Math.cos(lon);
            for (var m = 2; m <= lmax; m++) {
                sinm[m] = 2 * sinm[m - 1] * cosm[1] - sinm[m - 2];
                cosm[m] = 2 * cosm[m - 1] * cosm[1] - cosm[m - 2];
            }

            // Calculate value at pixel
            var expand = 0,
                cosidx = 0;
            for (var i = 1; i <= lmax + 1; i++) {
                cosidx += i;
            }
            for (var l = lmax; l >= 0; l--) {
                var idx = Math.floor(((l + 1) * l) / 2);
                // First coefficient is 1 when using 4pi normalization
                expand += idx != 0 ? flm[idx] * Ylm[idx - 1] : flm[idx];
                for (var m = 1; m <= l; m++) {
                    expand +=
                        (flm[++idx] * cosm[m] + flm[idx + cosidx - l - 1] * sinm[m]) * Ylm[idx - 1];
                }
            }

            return Math.round(expand);
        }

        /**
         * Renders image from spherical harmonic transform (SHT) hash.
         * @private
         * @param {string} shtHash - SHT hash.
         * @returns {ImageData} Rendered image.
         */
        function shtDecodeImage(shtHash) {
            if (shtYlm.length < 1) {
                // Decode Ylm if they're not already decoded
                var ylmLen = shtYlmStr.length / 32;
                for (var i = 0; i < 32; i++) {
                    shtYlm.push([]);
                    for (var j = 0; j < ylmLen; j++) {
                        shtYlm[i].push(
                            shtDecodeFloat(shtB83decode(shtYlmStr[i * ylmLen + j], 1), 41) *
                                shtMaxYlm
                        );
                    }
                }
            }

            // Decode SHT hash
            var lmax = shtB83decode(shtHash[0], 1)[0],
                maxVal = ((shtDecodeFloat(shtB83decode(shtHash[1], 1), 41) + 1) * 255) / 2,
                vals = shtB83decode(shtHash.slice(2), 2),
                rVals = [],
                gVals = [],
                bVals = [];
            for (var i = 0; i < vals.length; i++) {
                var v = shtDecodeCoeff(vals[i], maxVal);
                rVals.push(v[0]);
                gVals.push(v[1]);
                bVals.push(v[2]);
            }

            // Render image
            var lonStep = 0.03125 * Math.PI;
            var img = [];
            for (var i = 31; i >= 0; i--) {
                for (var j = 0; j < 64; j++) {
                    img.push(shtFlm2pixel(rVals, shtYlm[i], (j + 0.5) * lonStep));
                    img.push(shtFlm2pixel(gVals, shtYlm[i], (j + 0.5) * lonStep));
                    img.push(shtFlm2pixel(bVals, shtYlm[i], (j + 0.5) * lonStep));
                    img.push(255);
                }
            }
            return new ImageData(new Uint8ClampedArray(img), 64, 32);
        }
    }

    // Vertex shader for equirectangular and cube
    var v = [
        "attribute vec2 a_texCoord;",
        "varying vec2 v_texCoord;",

        "void main() {",
        // Set position
        "gl_Position = vec4(a_texCoord, 0.0, 1.0);",

        // Pass the coordinates to the fragment shader
        "v_texCoord = a_texCoord;",
        "}"
    ].join("");

    // Vertex shader for multires
    var vMulti = [
        "attribute vec3 a_vertCoord;",
        "attribute vec2 a_texCoord;",

        "uniform mat4 u_cubeMatrix;",
        "uniform mat4 u_perspMatrix;",

        "varying mediump vec2 v_texCoord;",

        "void main(void) {",
        // Set position
        "gl_Position = u_perspMatrix * u_cubeMatrix * vec4(a_vertCoord, 1.0);",

        // Pass the coordinates to the fragment shader
        "v_texCoord = a_texCoord;",
        "}"
    ].join("");

    // Fragment shader
    var fragEquiCubeBase = [
        "precision highp float;", // mediump looks bad on some mobile devices

        "uniform float u_aspectRatio;",
        "uniform float u_psi;",
        "uniform float u_theta;",
        "uniform float u_f;",
        "uniform float u_h;",
        "uniform float u_v;",
        "uniform float u_vo;",
        "uniform float u_rot;",

        "const float PI = 3.14159265358979323846264;",

        // Texture
        "uniform sampler2D u_image0;",
        "uniform sampler2D u_image1;",
        "uniform bool u_splitImage;",
        "uniform samplerCube u_imageCube;",

        // Coordinates passed in from vertex shader
        "varying vec2 v_texCoord;",

        // Background color (display for partial panoramas)
        "uniform vec4 u_backgroundColor;",

        "void main() {",
        // Map canvas/camera to sphere
        "float x = v_texCoord.x * u_aspectRatio;",
        "float y = v_texCoord.y;",
        "float sinrot = sin(u_rot);",
        "float cosrot = cos(u_rot);",
        "float rot_x = x * cosrot - y * sinrot;",
        "float rot_y = x * sinrot + y * cosrot;",
        "float sintheta = sin(u_theta);",
        "float costheta = cos(u_theta);",
        "float a = u_f * costheta - rot_y * sintheta;",
        "float root = sqrt(rot_x * rot_x + a * a);",
        "float lambda = atan(rot_x / root, a / root) + u_psi;",
        "float phi = atan((rot_y * costheta + u_f * sintheta) / root);"
    ].join("\n");

    // Fragment shader
    var fragCube =
        fragEquiCubeBase +
        [
            // Look up color from texture
            "float cosphi = cos(phi);",
            "gl_FragColor = textureCube(u_imageCube, vec3(cosphi*sin(lambda), sin(phi), cosphi*cos(lambda)));",
            "}"
        ].join("\n");

    // Fragment shader
    var fragEquirectangular =
        fragEquiCubeBase +
        [
            // Wrap image
            "lambda = mod(lambda + PI, PI * 2.0) - PI;",

            // Map texture to sphere
            "vec2 coord = vec2(lambda / PI, phi / (PI / 2.0));",

            // Look up color from texture
            // Map from [-1,1] to [0,1] and flip y-axis
            "if(coord.x < -u_h || coord.x > u_h || coord.y < -u_v + u_vo || coord.y > u_v + u_vo)",
            "gl_FragColor = u_backgroundColor;",
            "else {",
            "if(u_splitImage) {",
            // Image was split into two textures to work around texture size limits
            "if(coord.x < 0.0)",
            "gl_FragColor = texture2D(u_image0, vec2((coord.x + u_h) / u_h, (-coord.y + u_v + u_vo) / (u_v * 2.0)));",
            "else",
            "gl_FragColor = texture2D(u_image1, vec2((coord.x + u_h) / u_h - 1.0, (-coord.y + u_v + u_vo) / (u_v * 2.0)));",
            "} else {",
            "gl_FragColor = texture2D(u_image0, vec2((coord.x + u_h) / (u_h * 2.0), (-coord.y + u_v + u_vo) / (u_v * 2.0)));",
            "}",
            "}",
            "}"
        ].join("\n");

    // Fragment shader
    var fragMulti = [
        "varying mediump vec2 v_texCoord;",
        "uniform sampler2D u_sampler;",
        //'uniform mediump vec4 u_color;',

        "void main(void) {",
        // Look up color from texture
        "gl_FragColor = texture2D(u_sampler, v_texCoord);",
        //    'if(v_texCoord.x > 0.99 || v_texCoord.y > 0.99 || v_texCoord.x < 0.01 || v_texCoord.y < 0.01) {gl_FragColor = vec4(0.0,0.0,0.0,1.0);}', // Draw tile edges
        //    'gl_FragColor = u_color;',
        "}"
    ].join("");

    return {
        renderer: function (container, image, imagetype) {
            return new Renderer(container, image, imagetype);
        }
    };
})(window, document);
