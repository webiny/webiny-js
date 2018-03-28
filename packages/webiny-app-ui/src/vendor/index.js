import {Webiny} from 'webiny-app';

export default () => {
    Webiny.registerModule(
        new Webiny.Module('Webiny/Vendors/C3', () => import('./C3')),
        new Webiny.Module('Webiny/Vendors/CodeMirror', () => import('./CodeMirror')),
        new Webiny.Module('Webiny/Vendors/Cropper', () => import('./Cropper')),
        new Webiny.Module('Webiny/Vendors/DateTimePicker', () => import('./DateTimePicker')),
        new Webiny.Module('Webiny/Vendors/Draft', () => import('./Draft')),
        new Webiny.Module('Webiny/Vendors/Highlight', () => import('./Highlight')),
        new Webiny.Module('Webiny/Vendors/Moment', () => import('./Moment')),
        new Webiny.Module('Webiny/Vendors/OwlCarousel', () => import('./OwlCarousel')),
        new Webiny.Module('Webiny/Vendors/Quill', () => import('./Quill')),
        new Webiny.Module('Webiny/Vendors/Select2', () => import('./Select2'))
    );
};