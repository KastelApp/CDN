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

require('dotenv').config();
const FileUpload = require("../database/Schemas/FileUpload");
const Route = require("../utils/Route");
const minio = require('../utils/minio');
const Snowflake = require('../utils/classes/snowflake');

new Route("/upload", "post", async (req, res, app) => {
    if (!req.files) {
        return res.status(400).json({
            error: "No File Provided"
        });
    }

    if (!req.message) {
        return res.status(401).json({
            error: "Unauthorized"
        });
    }

    const snowflakeId = Snowflake().generate();

    const message = req.message;

    const file = req.files.file;
    const filePath = `${message.guild.id}/${message.channel.id}/${message.id}/${file.name}`;

    // limit file size to 25MB
    if (file.size > process.env.FILE_UPLOAD_LIMIT) {
        return res.status(400).json({
            error: "File Size Too Large"
        });
    }

    const upload = new FileUpload({
        _id: snowflakeId,
        name: file.name,
        path: filePath,
        size: file.size,
        user: message.user.id,
        guild: message.guild.id,
        channel: message.channel.id,
        message: message.id
    });

    upload.save().then(() => {
        minio.uploadFile('test', file.name, filePath).then(() => {
            res.status(200).json({
                success: true
            });
        }).catch(err => {
            res.status(500).json({
                error: err
            });
        });
    }).catch((error) => {
        res.status(500).json({
            error: "Internal Server Error" + error
        });
    });
});