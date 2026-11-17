const A = "ADMIN";
const M = "MANAGER";
const T = "TECHNICIAN";
const I = "INVENTORY_STAFF";
const S = "STAFF";

export const ACTION_ROLES = {
    "asset.manage": [M, T], // thêm / sửa thiết bị, địa điểm, ngưỡng cảnh báo, BOM
    "wo.create": [M, T, I, S], // tạo phiếu việc
    "wo.assign": [M], // giao việc / đổi người phụ trách
    "wo.progress": [M, T], // bắt đầu, tạm dừng, hoàn thành, tick checklist
    "wo.close": [M], // nghiệm thu, đóng, hủy phiếu
    "wo.issuePart": [M, I], // cấp phát vật tư cho phiếu
    "inventory.adjust": [M, I], // nhập / xuất / điều chỉnh tồn kho, thêm vật tư
    "schedule.manage": [M, T], // tạo / sửa kế hoạch, sinh phiếu từ kế hoạch
    "schedule.generate": [M], // chạy bộ sinh phiếu định kỳ hàng loạt
    "iot.handleAlert": [M, T], // tiếp nhận, giải quyết cảnh báo
    "telemetry.write": [M, T, S], // nhập số đo
    "user.manage": [A], // tạo tài khoản, khóa, đổi vai trò
};

export const VIEW_ROLES = {
    schedules: [A, M, T],
    inventory: [A, M, T, I],
    iot: [A, M, T, S],
    reports: [A, M],
    users: [A, M], // MANAGER xem danh sách để giao việc
    audit: [A], // nhật ký hệ thống do ADMIN quản
};

export const can = (role, action) =>
    !!role && (ACTION_ROLES[action] || []).includes(role);
export const canView = (role, area) =>
    !!role && (VIEW_ROLES[area] || []).includes(role);
