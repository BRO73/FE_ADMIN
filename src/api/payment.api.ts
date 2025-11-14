import api from "./axiosInstance";

// Request DTO
export interface PaymentRequestDTO {
  orderId: number;
  returnUrl: string;
  cancelUrl: string;
  amount: number; // Thêm thuộc tính amount
  discountCode?: string; // Thêm nếu chưa có
  promotionId?: number; // Thêm nếu chưa có
}
// Response DTO
export interface PaymentResponseDTO {
  transactionCode: string;
  checkoutUrl: string;
  paymentStatus: string;
  orderId: number;
}

/**
 * Tạo payment link cho order
 * @param request - Payment request với orderId, returnUrl, cancelUrl
 * @returns Payment response với paymentUrl
 */
export const createPaymentLink = async (
  request: PaymentRequestDTO
): Promise<PaymentResponseDTO> => {
  const response = await api.post<PaymentResponseDTO>(
    "/payments/create",
    request
  );

  return response.data;
};

export const processCashPayment = async (
  orderId: number,
  amountReceived?: number
) => {
  const payload: any = { orderId };

  // Chỉ gửi amountReceived nếu có giá trị
  if (amountReceived !== undefined && amountReceived !== null) {
    payload.amountReceived = amountReceived;
  }

  const response = await api.post("/payments/cash", payload);
  return response.data;
};
