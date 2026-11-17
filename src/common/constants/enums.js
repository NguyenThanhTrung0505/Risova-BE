export const USER_ROLES = [
    "ADMIN",
    "MANAGER",
    "TECHNICIAN",
    "STAFF",
    "INVENTORY_STAFF",
];
export const LOCATION_TYPES = ["PLANT", "ZONE", "LINE"];
export const ASSET_STATUSES = ["ACTIVE", "MAINTENANCE", "BROKEN", "RETIRED"];
export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
export const SCHEDULE_TYPES = ["TIME_BASED", "METER_BASED", "HYBRID"];
export const TELEMETRY_SOURCES = ["IOT_SENSOR", "MANUAL"];
export const WO_TYPES = ["PREVENTIVE", "REPAIR", "EMERGENCY"]; // "PHÒNG NGỪA", "SỬA CHỮA", "KHẨN CẤP"
export const WO_STATUSES = [
    "OPEN",
    "ASSIGNED",
    "IN_PROGRESS",
    "ON_HOLD",
    "COMPLETED",
    "CLOSED",
    "CANCELLED",
];
export const ALERT_LEVELS = ["WARNING", "DANGER"];
export const ALERT_STATUSES = ["OPEN", "ACKNOWLEDGED", "RESOLVED"];
export const INVENTORY_TXN_TYPES = ["RECEIPT", "ISSUE", "RETURN", "ADJUSTMENT"];

export const ACTIVE_WO_STATUSES = [
    "OPEN",
    "ASSIGNED",
    "IN_PROGRESS",
    "ON_HOLD",
]; // Phiếu còn "sống" (chưa hoàn tất / chưa hủy)
