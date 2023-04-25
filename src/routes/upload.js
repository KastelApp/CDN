/* !
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 Ritam Choudhuri(Xcyth)
 * GPL 3.0 Licensed
 */

require('dotenv').config();
const FileUpload = require("../utils/Schemas/FileUpload");
const { Route } = require("@kastelll/core");

const { HTTPErrors } = require('@kastelll/util');

new Route("/upload", "POST", [], async (req, res, app) => {

    /**
     * @type {import('../types/Routes/UploadStuff').UploadBody}
     */
    const { FileName, UserId, ChannelId, GuildId } = req.body;

    const File = req.files?.File;

    if (!File) {
        const Errors = new HTTPErrors(2000, {
            Files: {
                Message: "No files were uploaded.",
            }
        });

        res.status(400).json(Errors.toJSON());

        return;
    }

    // do minio stuff here ig
    req.app.minio
});