export const parsePagination = (query) => {
    let { page, pageSize } = query;
    const pageDefault = 1;
    const pageSizeDefault = 10;
    const maxPageSize = 500;
    page = Number(page);
    let limit = Number(pageSize);
    if (page <= 0) {
        page = pageDefault;
    }
    if (limit <= 0) {
        limit = pageSizeDefault;
    }
    if (limit > maxPageSize) {
        limit = pageSizeDefault;
    }
    if (!Number.isSafeInteger(page)) {
        page = pageDefault;
    }
    if (!Number.isSafeInteger(limit)) {
        limit = pageSizeDefault;
    }
    const offset = (page - 1) * limit;
    return { page, limit, offset };
};

export const formatPaginated = (items, total, page, limit) => ({
    items,
    pagination: {
        total: Number(total),
        page,
        limit,
        totalPages: Math.ceil(Number(total) / limit),
    },
});
