export const validate = (schema) => (req, res, next) => {
    try {
        const parsed = schema.parse({
            // parse này ở router riêng của mỗi đứa
            body: req.body,
            query: req.query,
            params: req.params,
        });
        if (parsed.body) req.body = parsed.body;
        if (parsed.query) req.query = parsed.query;
        if (parsed.params) req.params = parsed.params;
        next();
    } catch (error) {
        next(error);
    }
};
