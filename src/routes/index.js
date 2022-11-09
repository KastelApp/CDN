const Route = require("../utils/Route");

new Route('/', 'GET', async (req, res, app) => {
    res.send('Hello World!');
});