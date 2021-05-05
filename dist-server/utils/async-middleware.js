"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const asyncMiddleware = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
exports.default = asyncMiddleware;
//# sourceMappingURL=async-middleware.js.map