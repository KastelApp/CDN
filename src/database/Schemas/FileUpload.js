/* !
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright© 2022-2023 Ritam Choudhuri(Xcyth)
 * GPL 3.0 Licensed
 */

const mongoose = require('mongoose');

const FileUploadSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    user: {
        type: Number,
        required: true
    },
    guild: {
        type: Number,
        required: true
    },
    channel: {
        type: Number,
        required: true
    },
    message: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('FileUpload', FileUploadSchema);