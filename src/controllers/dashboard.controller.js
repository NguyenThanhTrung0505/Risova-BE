import { db } from "../prisma/db.ts";
import { responseSuccess } from "../common/helpers/response.helper.js";

const dashboardController = {
    // KPI tổng quan cho Dashboard FE
    getOverview: async (req, res, next) => {
        try {
            const [assets, workOrders, parts, alerts, downtimes] =
                await Promise.all([
                    db.orm.public.Assets.all(),
                    db.orm.public.WorkOrders.all(),
                    db.orm.public.SpareParts.where({ isActive: true }).all(),
                    db.orm.public.Alerts.all(),
                    db.orm.public.DowntimeEvents.all(),
                ]);

            const assetStats = {
                total: assets.length,
                active: assets.filter((a) => a.status === "ACTIVE").length,
                maintenance: assets.filter((a) => a.status === "MAINTENANCE")
                    .length,
                broken: assets.filter((a) => a.status === "BROKEN").length,
                retired: assets.filter((a) => a.status === "RETIRED").length,
            };

            const woStats = {
                total: workOrders.length,
                open: workOrders.filter((w) => w.status === "OPEN").length,
                assigned: workOrders.filter((w) => w.status === "ASSIGNED")
                    .length,
                inProgress: workOrders.filter((w) => w.status === "IN_PROGRESS")
                    .length,
                onHold: workOrders.filter((w) => w.status === "ON_HOLD").length,
                completed: workOrders.filter((w) => w.status === "COMPLETED")
                    .length,
                closed: workOrders.filter((w) => w.status === "CLOSED").length,
            };

            const lowStockParts = parts.filter(
                (p) => Number(p.quantityInStock) <= Number(p.minStockLevel),
            );

            const activeAlerts = alerts.filter((a) => a.status !== "RESOLVED");

            // Tính tổng giờ dừng máy (Downtime Hours)
            let totalDowntimeMinutes = 0;
            for (const dt of downtimes) {
                if (dt.startedAt && dt.endedAt) {
                    totalDowntimeMinutes +=
                        (new Date(dt.endedAt).getTime() -
                            new Date(dt.startedAt).getTime()) /
                        60000;
                }
            }

            const resData = responseSuccess({
                assets: assetStats,
                workOrders: woStats,
                inventory: {
                    totalParts: parts.length,
                    lowStockCount: lowStockParts.length,
                    lowStockItems: lowStockParts.slice(0, 10),
                },
                alerts: {
                    activeCount: activeAlerts.length,
                    dangerCount: activeAlerts.filter(
                        (a) => a.level === "DANGER",
                    ).length,
                },
                totalDowntimeHours: Number(
                    (totalDowntimeMinutes / 60).toFixed(2),
                ),
            });
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },

    // Lấy thông báo của user đang đăng nhập
    getNotifications: async (req, res, next) => {
        try {
            const list = await db.orm.public.Notifications.where({
                userId: Number(req.user.id),
            }).all();

            const formatted = list
                .sort((a, b) => Number(b.id) - Number(a.id))
                .slice(0, 30)
                .map((n) => ({ ...n, id: Number(n.id), type: n._type }));

            const resData = responseSuccess(formatted);
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },

    markNotificationRead: async (req, res, next) => {
        try {
            await db.orm.public.Notifications.where({
                id: BigInt(req.params.id),
            }).update({
                isRead: true,
                readAt: new Date(),
            });
            const resData = responseSuccess(null, "Đã đánh dấu đã đọc");
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },
};

export default dashboardController;
