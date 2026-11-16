export const validate = (schema) => (req, res, next) => {
    try {
        const parsed = schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        if (parsed.body) req.body = parsed.body;
        if (parsed.query) Object.assign(req.query, parsed.query);
        if (parsed.params) Object.assign(req.params, parsed.params);
        next();
    } catch (error) {
        next(error);
    }
};
