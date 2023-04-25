/* !
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 DarkerInk
 * Copyright(c) 2022-2023 Ritam Choudhuri(Xcyth)
 * GPL 3.0 Licensed
 */

require('dotenv').config();

const mongoose = require('mongoose');
const Express = require('express');
const { Route } = require('@kastelll/core');
const { join } = require('node:path');
const Routes = Route.LoadRoutes(join(__dirname, 'routes'));
const app = Express();
const BodyParser = require('body-parser');
const { Snowflake } = require('@kastelll/util');
const FileUpload = require('express-fileupload');
const Minio = require('./utils/Classes/Minio');

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));

app.use(FileUpload({
    limits: { fileSize: process.env.FileUploadLimit },
}));


Route.SetRoutes(app);

app.listen(62240, () => {

    mongoose.set('strictQuery', true);

    mongoose
        .connect(process.env.MongoUri, {})
        .then(() => console.info('[Database] MongoDB connected!'))
        .catch((error) => {
            console.error('[Database] Failed to connect to MongoDB', error);
            process.exit();
        });

    app.snowflake = new Snowflake({
        Epoch: 1641016800000,
        ProcessId: process.pid,
        ProcessIdBytes: 1,
        SequenceBytes: 6,
        WorkerId: 2,
        WorkerIdBytes: 12,
    });

    app.minio = new Minio(process.env.MinioEndpoint, process.env.MinioPort, process.env.MinioUseSSL, process.env.MinioAccessKey, process.env.MinioSecretKey);

    console.log(`[Server] Server is running on 62240`);

    console.log(`[Server] Loaded ${Routes.length} routes`);
});