import inventoryRepository from "../repository/inventory.repository.js";
import { AppError } from "../common/helpers/error.helper.js";
import {
    formatPaginated,
    parsePagination,
} from "../common/helpers/pagination.helper.js";

const inventoryService = {
    getParts: async (query) => {
        const { page, limit, offset } = parsePagination(query);
        let parts = await inventoryRepository.findAllParts();

        if (query.lowStock === "true") {
            parts = parts.filter(
                (p) => Number(p.quantityInStock) <= Number(p.minStockLevel),
            );
        }
        if (query.search) {
            const kw = query.search.toLowerCase();
            parts = parts.filter(
                (p) =>
                    p.partCode.toLowerCase().includes(kw) ||
                    p.name.toLowerCase().includes(kw),
            );
        }

        parts.sort((a, b) => a.id - b.id);
        const mapped = parts.map((p) => ({
            ...p,
            availableQuantity: Math.max(
                0,
                Number(p.quantityInStock) - Number(p.reservedQuantity),
            ),
            isLowStock: Number(p.quantityInStock) <= Number(p.minStockLevel),
        }));

        return formatPaginated(
            mapped.slice(offset, offset + limit),
            mapped.length,
            page,
            limit,
        );
    },

    createPart: async (data) => {
        return await inventoryRepository.createPart(data);
    },

    // Nhập kho (RECEIPT) hoặc Kiểm kê điều chỉnh (ADJUSTMENT)
    recordStockMovement: async (
        { partId, transactionType, quantity, supplierName },
        userId,
    ) => {
        const part = await inventoryRepository.findPartById(partId);
        if (!part) throw new AppError("Vật tư không tồn tại", 404);

        const currentStock = Number(part.quantityInStock);
        const qty = Number(quantity);

        if (transactionType === "RECEIPT" && qty <= 0) {
            throw new AppError("Số lượng nhập kho phải lớn hơn 0", 400);
        }

        const newStock = currentStock + qty;
        if (newStock < 0) {
            throw new AppError("Tồn kho sau điều chỉnh không thể âm", 400);
        }

        await inventoryRepository.updatePart(partId, {
            quantityInStock: newStock,
        });
        const txn = await inventoryRepository.createTransaction({
            partId,
            transactionType,
            quantity: qty,
            performedBy: userId,
            supplierName: supplierName || null,
        });

        return {
            part: await inventoryRepository.findPartById(partId),
            transaction: txn,
        };
    },

    // Thủ kho duyệt xuất vật tư cho Work Order (RESERVED -> ISSUED)
    issueWorkOrderPart: async (woPartId, { quantityIssued }, userId) => {
        const woPart = await inventoryRepository.findWoPartById(woPartId);
        if (!woPart)
            throw new AppError("Không tìm thấy yêu cầu vật tư của phiếu", 404);
        if (woPart.status !== "RESERVED") {
            throw new AppError(
                `Không thể xuất vật tư ở trạng thái ${woPart.status}`,
                400,
            );
        }

        const part = await inventoryRepository.findPartById(woPart.partId);
        if (!part) throw new AppError("Vật tư không tồn tại", 404);

        const issueQty = Number(quantityIssued ?? woPart.quantityNeeded);
        const currentStock = Number(part.quantityInStock);
        const currentReserved = Number(part.reservedQuantity);

        if (issueQty > currentStock) {
            throw new AppError(
                `Tồn kho không đủ (Hiện có: ${currentStock} ${part.unit})`,
                400,
            );
        }

        // Trừ tồn kho thực tế và giải phóng phần đã giữ chỗ tương ứng
        const newStock = currentStock - issueQty;
        const newReserved = Math.max(
            0,
            currentReserved - Number(woPart.quantityNeeded),
        );

        await inventoryRepository.updatePart(part.id, {
            quantityInStock: newStock,
            reservedQuantity: newReserved,
        });

        await inventoryRepository.updateWoPart(woPartId, {
            quantityIssued: issueQty,
            status: "ISSUED",
            approvedBy: userId,
            approvedAt: new Date(),
        });

        // Quy ước DB: âm = xuất kho
        await inventoryRepository.createTransaction({
            partId: part.id,
            workOrderId: woPart.workOrderId,
            transactionType: "ISSUE",
            quantity: -Math.abs(issueQty),
            performedBy: userId,
        });

        return await inventoryRepository.findWoPartById(woPartId);
    },

    // Hoàn trả vật tư thừa sau khi sửa xong (RETURN)
    returnWorkOrderPart: async (woPartId, { quantityReturned }, userId) => {
        const woPart = await inventoryRepository.findWoPartById(woPartId);
        if (!woPart || woPart.status !== "ISSUED") {
            throw new AppError("Chỉ có thể trả vật tư đã xuất (ISSUED)", 400);
        }

        const returnQty = Number(quantityReturned);
        const issuedQty = Number(woPart.quantityIssued);
        if (returnQty < 0 || returnQty > issuedQty) {
            throw new AppError("Số lượng hoàn trả không hợp lệ", 400);
        }

        const part = await inventoryRepository.findPartById(woPart.partId);
        const consumedQty = issuedQty - returnQty;

        if (returnQty > 0) {
            await inventoryRepository.updatePart(part.id, {
                quantityInStock: Number(part.quantityInStock) + returnQty,
            });
            await inventoryRepository.createTransaction({
                partId: part.id,
                workOrderId: woPart.workOrderId,
                transactionType: "RETURN",
                quantity: returnQty,
                performedBy: userId,
            });
        }

        await inventoryRepository.updateWoPart(woPartId, {
            quantityConsumed: consumedQty,
            status: "CONSUMED",
        });

        return await inventoryRepository.findWoPartById(woPartId);
    },

    getTransactions: async (query) => {
        const { page, limit, offset } = parsePagination(query);
        const list = await inventoryRepository.getTransactionsByPart(
            query.partId,
        );
        return formatPaginated(
            list.slice(offset, offset + limit),
            list.length,
            page,
            limit,
        );
    },
};

export default inventoryService;
