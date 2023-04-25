/* !
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 Ritam Choudhuri(Xcyth)
 * Copyright(c) 2022-2023 DarkerInk
 * GPL 3.0 Licensed
 */

const mongoose = require('mongoose');

const FileUploadSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },

    Name: {
        type: String,
        required: true
    },

    Path: {
        type: String,
        required: true
    },

    Size: {
        type: Number,
        required: true
    },

    Type: {
        type: String,
        required: true
    },

    Date: {
        type: Number,
        default: Date.now()
    },

    User: {
        type: String,
        required: true,
        index: true
    },

    Guild: { // not required (avatar hash possible)
        type: String,
        required: false,
        index: true
    },

    Channel: { // not required (avatar hash possible)
        type: String,
        required: false,
        index: true
    },

    Deleted: {
        type: Boolean,
        default: false,
        index: true
    }
});

module.exports = mongoose.model('FileUpload', FileUploadSchema);