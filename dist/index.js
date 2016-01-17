'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function () {
    let root = arguments.length <= 0 || arguments[0] === undefined ? '.' : arguments[0];
    let options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
    let cache = arguments[2];

    options = Object.assign({
        max: 100,
        cache: true,
        index: '/index'
    }, options);

    cache = (0, _lruCache2.default)(options.max);
    _artTemplate2.default.config('cache', false);
    _artTemplate2.default.config('base', root = (0, _path.normalize)((0, _path.resolve)(root)));

    return function* (next) {
        yield next;

        let path = (0, _path.join)(root, (this.path === '/' ? options.index : this.path) + '.html');

        try {
            if ((yield _coFs2.default.stat(path)).isFile()) {
                if (!options.cache) {
                    cache.reset();
                }

                this.type = 'html';
                this.body = yield render(cache, path, this.body, this.globalData);
            }
        } catch (err) {
            if (~['ENOENT', 'ENAMETOOLONG', 'ENOTDIR'].indexOf(err.code)) {
                return;
            }
        }
    };
};

var _coFs = require('co-fs');

var _coFs2 = _interopRequireDefault(_coFs);

var _lruCache = require('lru-cache');

var _lruCache2 = _interopRequireDefault(_lruCache);

var _artTemplate = require('art-template');

var _artTemplate2 = _interopRequireDefault(_artTemplate);

var _path = require('path');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function* render(cache, path, data) {
    let defaultData = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

    let compile = cache.get(path);

    if (!compile) {
        compile = _artTemplate2.default.compile((yield _coFs2.default.readFile(path, 'utf-8')));
        cache.set(path, compile);
    }

    if (typeof data === 'object' && !Array.isArray(data)) {
        return compile(Object.assign({}, defaultData, data));
    } else {
        return compile(defaultData);
    }
}