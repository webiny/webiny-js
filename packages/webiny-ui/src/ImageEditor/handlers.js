// @flow
// import $ from "jquery";
// import ImageEditor from "tui-image-editor";
// import sample from "./cms.jpg";

// export default () => {
/*
const supportingFileAPI = !!(window.File && window.FileList && window.FileReader);
const rImageType = /data:(image\/.+);base64,/;
const shapeOptions = {};
let shapeType;
let activeObjectId;

// Buttons
const $btns = $(".menu-item");
const $btnsActivatable = $btns.filter(".activatable");
const $inputImage = $("#input-image-file");
const $btnDownload = $("#btn-download");

const $btnClearObjects = $("#btn-clear-objects");
const $btnRemoveActiveObject = $("#btn-remove-active-object");

*/

/*
const $btnDrawShape = $("#btn-draw-shape");
const $btnText = $("#btn-text");
const $btnTextStyle = $(".btn-text-style");
const $btnAddIcon = $("#btn-add-icon");
const $btnRegisterIcon = $("#btn-register-icon");
const $btnMaskFilter = $("#btn-mask-filter");
const $btnImageFilter = $("#btn-image-filter");
const $btnLoadMaskImage = $("#input-mask-image-file");
const $btnApplyMask = $("#btn-apply-mask");
const $btnClose = $(".close");

// Input etc.
const $inputBrushWidthRange = $("#input-brush-width-range");
const $inputFontSizeRange = $("#input-font-size-range");
const $inputStrokeWidthRange = $("#input-stroke-width-range");
const $inputCheckTransparent = $("#input-check-transparent");
const $inputCheckGrayscale = $("#input-check-grayscale");
const $inputCheckInvert = $("#input-check-invert");
const $inputCheckSepia = $("#input-check-sepia");
const $inputCheckSepia2 = $("#input-check-sepia2");
const $inputCheckBlur = $("#input-check-blur");
const $inputCheckSharpen = $("#input-check-sharpen");
const $inputCheckEmboss = $("#input-check-emboss");
const $inputCheckRemoveWhite = $("#input-check-remove-white");
const $inputRangeRemoveWhiteThreshold = $("#input-range-remove-white-threshold");
const $inputRangeRemoveWhiteDistance = $("#input-range-remove-white-distance");
const $inputCheckBrightness = $("#input-check-brightness");
const $inputRangeBrightnessValue = $("#input-range-brightness-value");
const $inputCheckNoise = $("#input-check-noise");
const $inputRangeNoiseValue = $("#input-range-noise-value");
const $inputCheckGradientTransparency = $("#input-check-gradient-transparancy");
const $inputRangeGradientTransparencyValue = $("#input-range-gradient-transparency-value");
const $inputCheckPixelate = $("#input-check-pixelate");
const $inputRangePixelateValue = $("#input-range-pixelate-value");
const $inputCheckTint = $("#input-check-tint");
const $inputRangeTintOpacityValue = $("#input-range-tint-opacity-value");
const $inputCheckMultiply = $("#input-check-multiply");
const $inputCheckBlend = $("#input-check-blend");
const $inputCheckColorFilter = $("#input-check-color-filter");
const $inputRangeColorFilterValue = $("#input-range-color-filter-value");

*/
// Sub menus
let $displayingSubMenu = $();
/*
const $drawShapeSubMenu = $("#draw-shape-sub-menu");
const $textSubMenu = $("#text-sub-menu");
const $iconSubMenu = $("#icon-sub-menu");
const $filterSubMenu = $("#filter-sub-menu");
const $imageFilterSubMenu = $("#image-filter-sub-menu");


// Select shape type
const $selectShapeType = $('[name="select-shape-type"]');

// Select color of shape type
const $selectColorType = $('[name="select-color-type"]');

//Select blend type
const $selectBlendType = $('[name="select-blend-type"]');

    // Color picker for text palette
    const textColorpicker = tui.component.colorpicker.create({
        container: $("#tui-text-color-picker")[0],
        color: "#000000"
    });

    // Color picker for shape
    const shapeColorpicker = tui.component.colorpicker.create({
        container: $("#tui-shape-color-picker")[0],
        color: "#000000"
    });

    // Color picker for icon
    const iconColorpicker = tui.component.colorpicker.create({
        container: $("#tui-icon-color-picker")[0],
        color: "#000000"
    });

    const tintColorpicker = tui.component.colorpicker.create({
        container: $("#tui-tint-color-picker")[0],
        color: "#000000"
    });

    const multiplyColorpicker = tui.component.colorpicker.create({
        container: $("#tui-multiply-color-picker")[0],
        color: "#000000"
    });

    const blendColorpicker = tui.component.colorpicker.create({
        container: $("#tui-blend-color-picker")[0],
        color: "#00FF00"
    });

    function base64ToBlob(data) {
        let mimeString = "";
        let raw, uInt8Array, i, rawLength;

        raw = data.replace(rImageType, function(header, imageType) {
            mimeString = imageType;

            return "";
        });

        raw = atob(raw);
        rawLength = raw.length;
        uInt8Array = new Uint8Array(rawLength); // eslint-disable-line

        for (i = 0; i < rawLength; i += 1) {
            uInt8Array[i] = raw.charCodeAt(i);
        }

        return new Blob([uInt8Array], { type: mimeString });
    }

    function resizeEditor() {
        const $editor = $(".tui-image-editor");
        const $container = $(".tui-image-editor-canvas-container");
        const height = parseFloat($container.css("max-height"));

        $editor.height(height);
    }

    function activateShapeMode() {
        if (imageEditor.getDrawingMode() !== "SHAPE") {
            imageEditor.stopDrawingMode();
            imageEditor.startDrawingMode("SHAPE");
        }
    }

    function activateIconMode() {
        imageEditor.stopDrawingMode();
    }

    function activateTextMode() {
        if (imageEditor.getDrawingMode() !== "TEXT") {
            imageEditor.stopDrawingMode();
            imageEditor.startDrawingMode("TEXT");
        }
    }

    function setTextToolbar(obj) {
        const fontSize = obj.fontSize;
        const fontColor = obj.fill;

        $inputFontSizeRange.val(fontSize);
        textColorpicker.setColor(fontColor);
    }

    function setIconToolbar(obj) {
        const iconColor = obj.fill;

        iconColorpicker.setColor(iconColor);
    }

    function setShapeToolbar(obj) {
        let strokeColor, fillColor, isTransparent;
        const colorType = $selectColorType.val();

        if (colorType === "stroke") {
            strokeColor = obj.stroke;
            isTransparent = strokeColor === "transparent";

            if (!isTransparent) {
                shapeColorpicker.setColor(strokeColor);
            }
        } else if (colorType === "fill") {
            fillColor = obj.fill;
            isTransparent = fillColor === "transparent";

            if (!isTransparent) {
                shapeColorpicker.setColor(fillColor);
            }
        }

        $inputCheckTransparent.prop("checked", isTransparent);
        $inputStrokeWidthRange.val(obj.strokeWidth);
    }

    function showSubMenu(type) {
        let $submenu;

        switch (type) {
            case "shape":
                $submenu = $drawShapeSubMenu;
                break;
            case "icon":
                $submenu = $iconSubMenu;
                break;
            case "text":
                $submenu = $textSubMenu;
                break;
            default:
                $submenu = 0;
        }

        $displayingSubMenu.hide();
        $displayingSubMenu = $submenu.show();
    }

    function applyOrRemoveFilter(applying, type, options) {
        if (applying) {
            imageEditor.applyFilter(type, options).then(result => {
                console.log(result);
            });
        } else {
            imageEditor.removeFilter(type);
        }
    }

    // Attach image editor custom events
    imageEditor.on({
        objectAdded: function(objectProps) {
            console.info(objectProps);
        },
        undoStackChanged: function(length) {
            if (length) {
                $btnUndo.removeClass("disabled");
            } else {
                $btnUndo.addClass("disabled");
            }
            resizeEditor();
        },
        redoStackChanged: function(length) {
            if (length) {
                $btnRedo.removeClass("disabled");
            } else {
                $btnRedo.addClass("disabled");
            }
            resizeEditor();
        },
        objectScaled: function(obj) {
            if (obj.type === "text") {
                $inputFontSizeRange.val(obj.fontSize);
            }
        },
        addText: function(pos) {
            imageEditor
                .addText("Double Click", {
                    position: pos.originPosition
                })
                .then(objectProps => {
                    console.log(objectProps);
                });
        },
        objectActivated: function(obj) {
            activeObjectId = obj.id;
            if (obj.type === "rect" || obj.type === "circle" || obj.type === "triangle") {
                showSubMenu("shape");
                setShapeToolbar(obj);
                activateShapeMode();
            } else if (obj.type === "icon") {
                showSubMenu("icon");
                setIconToolbar(obj);
                activateIconMode();
            } else if (obj.type === "text") {
                showSubMenu("text");
                setTextToolbar(obj);
                activateTextMode();
            }
        },
        mousedown: function(event, originPointer) {
            if ($imageFilterSubMenu.is(":visible") && imageEditor.hasFilter("colorFilter")) {
                imageEditor.applyFilter("colorFilter", {
                    x: parseInt(originPointer.x, 10),
                    y: parseInt(originPointer.y, 10)
                });
            }
        }
    });

    // Attach button click event listeners
    $btns.on("click", function() {
        $btnsActivatable.removeClass("active");
    });

    $btnsActivatable.on("click", function() {
        $(this).addClass("active");
    });



    $btnClearObjects.on("click", function() {
        $displayingSubMenu.hide();
        imageEditor.clearObjects();
    });

    $btnRemoveActiveObject.on("click", function() {
        $displayingSubMenu.hide();
        imageEditor.removeObject(activeObjectId);
    });

    $inputImage.on("change", function(event) {
        let file;

        if (!supportingFileAPI) {
            alert("This browser does not support file-api");
        }

        file = event.target.files[0];
        imageEditor.loadImageFromFile(file).then(result => {
            console.log(result);
            imageEditor.clearUndoStack();
        });
    });



    // control draw shape mode
    $btnDrawShape.on("click", function() {
        showSubMenu("shape");

        // step 1. get options to draw shape from toolbar
        shapeType = $('[name="select-shape-type"]:checked').val();

        shapeOptions.stroke = "#000000";
        shapeOptions.fill = "#ffffff";

        shapeOptions.strokeWidth = Number($inputStrokeWidthRange.val());

        // step 2. set options to draw shape
        imageEditor.setDrawingShape(shapeType, shapeOptions);

        // step 3. start drawing shape mode
        activateShapeMode();
    });

    $selectShapeType.on("change", function() {
        shapeType = $(this).val();

        imageEditor.setDrawingShape(shapeType);
    });

    $inputCheckTransparent.on("change", function() {
        const colorType = $selectColorType.val();
        const isTransparent = $(this).prop("checked");
        let color;

        if (!isTransparent) {
            color = shapeColorpicker.getColor();
        } else {
            color = "transparent";
        }

        if (colorType === "stroke") {
            imageEditor.changeShape(activeObjectId, {
                stroke: color
            });
        } else if (colorType === "fill") {
            imageEditor.changeShape(activeObjectId, {
                fill: color
            });
        }

        imageEditor.setDrawingShape(shapeType, shapeOptions);
    });

    shapeColorpicker.on("selectColor", function(event) {
        const colorType = $selectColorType.val();
        const isTransparent = $inputCheckTransparent.prop("checked");
        const color = event.color;

        if (isTransparent) {
            return;
        }

        if (colorType === "stroke") {
            imageEditor.changeShape(activeObjectId, {
                stroke: color
            });
        } else if (colorType === "fill") {
            imageEditor.changeShape(activeObjectId, {
                fill: color
            });
        }

        imageEditor.setDrawingShape(shapeType, shapeOptions);
    });

    $inputStrokeWidthRange.on("change", function() {
        const strokeWidth = Number($(this).val());

        imageEditor.changeShape(activeObjectId, {
            strokeWidth: strokeWidth
        });

        imageEditor.setDrawingShape(shapeType, shapeOptions);
    });

    // control text mode
    $btnText.on("click", function() {
        showSubMenu("text");
        activateTextMode();
    });

    $inputFontSizeRange.on("change", function() {
        imageEditor.changeTextStyle(activeObjectId, {
            fontSize: parseInt(this.value, 10)
        });
    });

    $btnTextStyle.on("click", function(e) {
        // eslint-disable-line
        const styleType = $(this).attr("data-style-type");
        let styleObj;

        e.stopPropagation();

        switch (styleType) {
            case "b":
                styleObj = { fontWeight: "bold" };
                break;
            case "i":
                styleObj = { fontStyle: "italic" };
                break;
            case "u":
                styleObj = { textDecoration: "underline" };
                break;
            case "l":
                styleObj = { textAlign: "left" };
                break;
            case "c":
                styleObj = { textAlign: "center" };
                break;
            case "r":
                styleObj = { textAlign: "right" };
                break;
            default:
                styleObj = {};
        }

        imageEditor.changeTextStyle(activeObjectId, styleObj);
    });

    textColorpicker.on("selectColor", function(event) {
        imageEditor.changeTextStyle(activeObjectId, {
            fill: event.color
        });
    });

    // control icon
    $btnAddIcon.on("click", function() {
        showSubMenu("icon");
        activateIconMode();
    });

    function onClickIconSubMenu(event) {
        const element = event.target || event.srcElement;
        const iconType = $(element).attr("data-icon-type");

        imageEditor.once("mousedown", function(e, originPointer) {
            imageEditor
                .addIcon(iconType, {
                    left: originPointer.x,
                    top: originPointer.y
                })
                .then(objectProps => {
                    // console.log(objectProps);
                });
        });
    }

    $btnRegisterIcon.on("click", function() {
        $iconSubMenu
            .find(".menu-item")
            .eq(3)
            .after(
                '<li id="customArrow" class="menu-item icon-text" data-icon-type="customArrow">↑</li>'
            );

        imageEditor.registerIcons({
            customArrow: "M 60 0 L 120 60 H 90 L 75 45 V 180 H 45 V 45 L 30 60 H 0 Z"
        });

        $btnRegisterIcon.off("click");

        $iconSubMenu.on("click", "#customArrow", onClickIconSubMenu);
    });

    $iconSubMenu.on("click", ".icon-text", onClickIconSubMenu);

    iconColorpicker.on("selectColor", function(event) {
        imageEditor.changeIconColor(activeObjectId, event.color);
    });

    // control mask filter
    $btnMaskFilter.on("click", function() {
        imageEditor.stopDrawingMode();
        $displayingSubMenu.hide();

        $displayingSubMenu = $filterSubMenu.show();
    });

    $btnImageFilter.on("click", function() {
        const filters = {
            grayscale: $inputCheckGrayscale,
            invert: $inputCheckInvert,
            sepia: $inputCheckSepia,
            sepia2: $inputCheckSepia2,
            blur: $inputCheckBlur,
            shapren: $inputCheckSharpen,
            emboss: $inputCheckEmboss,
            removeWhite: $inputCheckRemoveWhite,
            brightness: $inputCheckBrightness,
            noise: $inputCheckNoise,
            gradientTransparency: $inputCheckGradientTransparency,
            pixelate: $inputCheckPixelate,
            tint: $inputCheckTint,
            multiply: $inputCheckMultiply,
            blend: $inputCheckBlend,
            colorFilter: $inputCheckColorFilter
        };

        tui.util.forEach(filters, function($value, key) {
            $value.prop("checked", imageEditor.hasFilter(key));
        });
        $displayingSubMenu.hide();

        $displayingSubMenu = $imageFilterSubMenu.show();
    });

    $btnLoadMaskImage.on("change", function() {
        let file;
        let imgUrl;

        if (!supportingFileAPI) {
            alert("This browser does not support file-api");
        }

        file = event.target.files[0];

        if (file) {
            imgUrl = URL.createObjectURL(file);

            imageEditor.loadImageFromURL(imageEditor.toDataURL(), "FilterImage").then(() => {
                imageEditor.addImageObject(imgUrl).then(objectProps => {
                    URL.revokeObjectURL(file);
                    console.log(objectProps);
                });
            });
        }
    });



    $inputCheckBrightness.on("change", function() {
        applyOrRemoveFilter(this.checked, "brightness", {
            brightness: parseInt($inputRangeBrightnessValue.val(), 10)
        });
    });

    $inputRangeBrightnessValue.on("change", function() {
        applyOrRemoveFilter($inputCheckBrightness.is(":checked"), "brightness", {
            brightness: parseInt(this.value, 10)
        });
    });

    $inputCheckNoise.on("change", function() {
        applyOrRemoveFilter(this.checked, "noise", {
            noise: parseInt($inputRangeNoiseValue.val(), 10)
        });
    });

    $inputRangeNoiseValue.on("change", function() {
        applyOrRemoveFilter($inputCheckNoise.is(":checked"), "noise", {
            noise: parseInt(this.value, 10)
        });
    });

    $inputCheckGradientTransparency.on("change", function() {
        applyOrRemoveFilter(this.checked, "gradientTransparency", {
            threshold: parseInt($inputRangeGradientTransparencyValue.val(), 10)
        });
    });

    $inputRangeGradientTransparencyValue.on("change", function() {
        applyOrRemoveFilter($inputCheckGradientTransparency.is(":checked"), "gradientTransparency", {
            threshold: parseInt(this.value, 10)
        });
    });

    $inputCheckPixelate.on("change", function() {
        applyOrRemoveFilter(this.checked, "pixelate", {
            blocksize: parseInt($inputRangePixelateValue.val(), 10)
        });
    });

    $inputRangePixelateValue.on("change", function() {
        applyOrRemoveFilter($inputCheckPixelate.is(":checked"), "pixelate", {
            blocksize: parseInt(this.value, 10)
        });
    });

    $inputCheckTint.on("change", function() {
        applyOrRemoveFilter(this.checked, "tint", {
            color: tintColorpicker.getColor(),
            opacity: parseFloat($inputRangeTintOpacityValue.val())
        });
    });

    tintColorpicker.on("selectColor", function(e) {
        applyOrRemoveFilter($inputCheckTint.is(":checked"), "tint", {
            color: e.color
        });
    });

    $inputRangeTintOpacityValue.on("change", function() {
        applyOrRemoveFilter($inputCheckTint.is(":checked"), "tint", {
            opacity: parseFloat($inputRangeTintOpacityValue.val())
        });
    });

    $inputCheckMultiply.on("change", function() {
        applyOrRemoveFilter(this.checked, "multiply", {
            color: multiplyColorpicker.getColor()
        });
    });

    multiplyColorpicker.on("selectColor", function(e) {
        applyOrRemoveFilter($inputCheckMultiply.is(":checked"), "multiply", {
            color: e.color
        });
    });

    $inputCheckBlend.on("change", function() {
        applyOrRemoveFilter(this.checked, "blend", {
            color: blendColorpicker.getColor(),
            mode: $selectBlendType.val()
        });
    });

    blendColorpicker.on("selectColor", function(e) {
        applyOrRemoveFilter($inputCheckBlend.is(":checked"), "blend", {
            color: e.color
        });
    });

    $selectBlendType.on("change", function() {
        applyOrRemoveFilter($inputCheckBlend.is(":checked"), "blend", {
            mode: this.value
        });
    });

    $inputCheckColorFilter.on("change", function() {
        applyOrRemoveFilter(this.checked, "colorFilter", {
            color: "#FFFFFF",
            threshold: $inputRangeColorFilterValue.val()
        });
    });

    $inputRangeColorFilterValue.on("change", function() {
        applyOrRemoveFilter($inputCheckColorFilter.is(":checked"), "colorFilter", {
            threshold: this.value
        });
    });

    */

// Etc..
// Load sample image
/*    imageEditor.loadImageFromURL(sample, "SampleImage").then(sizeValue => {
        console.log(sizeValue);
        imageEditor.clearUndoStack();
    });*/
// };
