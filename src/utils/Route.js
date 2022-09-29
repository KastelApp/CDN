/* !
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 DarkerInk
 * GPL 3.0 Licensed
 */


/**
 * @type {import('../../').RouteItem[]}
 */
const routes = [];
const vaildMethods = ['get', 'delete', 'head', 'options', 'post', 'put', 'patch', 'purge', 'all', 'ws', 'upgrade'];
const { statSync, readdirSync, readFileSync } = require('node:fs');
const {pathToRegexp} = require('path-to-regexp');
const { join } = require('node:path');

class Route {
    /**
     *  
     * @param {string} path 
     * @param {import('../../index').Methods|import('../../index').Methods[]} method 
     * @param {Function[]|import('../../').Run} middleware 
     * @param {import('../../').Run} run 
     */
    constructor(path, method, middleware, run) {

        /**
         * @type {string}
         * @private
         * @readonly
         * @description The directory of the route
         * @example
         * /home/user/CDN/src/routes/test.js
         */
        this._dir = new Error().stack.split('at ')[2].split(' ')[0].replace("file://", "").split(':').slice(0, -2).join(':')

        /**
         * @type {string}
         * @private
         * @readonly
         * @description The path of the route
         * @example
         * /api/v1/users
         * /api/v1/users/:id
         * /api/v1/users/:id/:name
         */
        this._path = path;


        this._route = this._cutter(this._dir, this.path);

        /**
         * @type {import('../../index').Methods}
         * @private
         * @readonly
         * @description The method of the route
         * @example
         * GET
         * POST
         * PUT
         */
        this._method = method;

        /**
         * @type {Function[]|import('../../').Run}
         * @private
         * @readonly
         * @description The middleware of the route or the run function
         */
        this._middleware = typeof middleware !== 'object' ? typeof middleware == 'function' ? [] : middleware : middleware;

        /**
         * @type {import('../../').Run}
         * @private
         * @readonly
         * @description The run function of the route
         */
        this._run = typeof run == 'undefined' ? typeof middleware !== 'object' ? typeof middleware == 'function' ? middleware : run : run : run;


        if (Array.isArray(this._method)) {
            for (let i = 0; i < this._method.length; i++) {
                if (!vaildMethods.includes(this._method[i].toLowerCase())) {
                    throw new Error(`${this._path} Has an Invalid Method (${this._method[i]})`);
                }
            }
        } else if (!vaildMethods.includes(this._method.toLowerCase())) {
            throw new Error(`${this._path} Has an Invalid Method (${this._method})`);
        }

        routes.push({
            method: this._method,
            path: this._path,
            route: this._route,
            regex: new RegExp(pathToRegexp(this._path)),
            run: this._run,
            middleware: this._middleware,
            Route: this,
        });
    }

    /**
     * @readonly
     * @example
     * /home/user/CDN/src/routes/test.js
     * @returns {readonly string} The directory of the route
     */
    get dir() {
        return this._dir;
    }

    /**
     * @readonly
     * @example
     * /api/v1/users
     * @returns {readonly string} The path of the route
     */
    get path() {
        return this._path;
    }

    /**
     * @readonly
     * @example
     * GET
     * POST
     * PUT
     * @returns {readonly import('../../index').Methods} The method of the route
     */
    get method() {
        return this._method;
    }

    /**
     * @readonly
     * @example
     * [GET, POST, PUT]
     * @returns {readonly import('../../index').Methods[]} The methods of the route
     */
    get methods() {
        return this._method;
    }

    /**
     * @readonly
     * @example
     * [Function, Function, Function]
     * @returns {readonly Function[]} The middleware of the route
     */
    get middleware() {
        return this._middleware;
    }

    /**
     * @readonly
     * @returns {readonly import('../../').Run} The run function of the route
     */
    get run() {
        return this._run;
    }

    /**
     * Runs the route
     * @param {import('hyper-express').Request} req 
     * @param {import('hyper-express').Response} res 
     * @param {import('hyper-express').Server} app 
     * @returns {Promise<void>}
     */
    run(req, res, app) {
        return this._run(req, res, app);
    }

    /**
     * Cuts the filePath, and adds the export path to make a proper route
     * @private
     * @param {String} filePath The full file path (/home/darkerink/kastel/routes/tests/cool.js)
     * @param {String} exportPath The exported path (cool_test)
     * @returns {String} The cut path (/tests/cool_test)
     */
    _cutter(filePath, exportPath) {

        const splitPath = filePath.split('/routes').pop();

        return `${splitPath}${exportPath.startsWith('/') ? exportPath : '/' + exportPath}`;
    }

    /**
     * Sets all the routes
     * @param {import('hyper-express').Server} app
     */
    static setRoutes(app) {
        if (!app) {
            throw new Error('Please provide the Express Server');
        }

        for (let i = 0; i < routes.length; i++) {
            const route = routes[i];

            if (Array.isArray(route.method)) {
                for (let j = 0; i < route.method.length; i++) {
                    app[(route.method[j].toLowerCase())](route.route, {
                        middleware: [...route.middleware],
                    }, (...args) => route.run(...args, app));
                }
            } else {
                app[(route.method.toLowerCase())](route.route, {
                    middleware: [...route.middleware],
                }, (...args) => route.run(...args, app));
            }
        }

        return routes;
    }

    /**
     * Goes through each DIR and adds them to the Array.
     * @param {String} fipath
     * @param {string[]} arr
     * @returns {string[]}
     */
    static throughAndThrough(fipath, arr) {
        const dirArray = (arr || []);

        const filePath = fipath;

        const fileInfo = statSync(filePath);

        if (fileInfo.isDirectory()) {
            const files = readdirSync(filePath);
            for (let i = 0; i < files.length; i++) {
                const fi = statSync(join(filePath, files[i]));

                if (fi.isDirectory()) {
                    Route.throughAndThrough(join(filePath, files[i]), dirArray);
                } else {
                    dirArray.push(join(filePath, files[i]));
                }
            }
        } else {
            dirArray.push(filePath);
        }

        return dirArray;
    }

    /**
     * Loads all the routes
     * @param {string} routePath 
     * @returns {import('../../').RouteItem[]}
     */
    static loadRoutes(routePath) {
        const fipaths = Route.throughAndThrough(routePath, []);

        for (let i = 0; i < fipaths.length; i++) {
            require(fipaths[i]);
        }

        return fipaths;
    }

    get[Symbol.toStringTag]() {
        return 'Route';
    }

    get routes() {
        return routes;
    }
}

module.exports = Route;