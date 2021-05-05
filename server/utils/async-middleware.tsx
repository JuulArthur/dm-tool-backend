const asyncMiddleware: (fn: any) => Function = (fn) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncMiddleware;
