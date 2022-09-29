const Route = require("../utils/Route");

new Route('/test', 'get', async (req, res, app) => {
    res.send('Test');
})