import api from "./axiosInstance";

// ============ REQUEST DTOs ============

export interface PaymentRequestDTO {
  orderId: number;
  returnUrl: string;
  cancelUrl: string;
  amount: number;
  promotionCode?: string; // Mã giảm giá cho bank transfer
}

export interface CashPaymentRequestDTO {
  orderId: number;
  amountReceived: number;
  promotionCode?: string; // Mã giảm giá cho cash payment
}

// ============ RESPONSE DTOs ============

export interface PaymentResponseDTO {
  transactionCode: string;
  checkoutUrl: string;
  paymentStatus: string;
  orderId: number;
}

export interface CashPaymentResponseDTO {
  transactionCode: string;
  paymentStatus: string;
  orderId: number;
  amountReceived: number;
  change?: number;
}

// ============ API FUNCTIONS ============

/**
 * Tạo payment link cho thanh toán chuyển khoản
 * Backend sẽ validate và áp dụng promotion (nếu có promotionCode)
 *
 * @param request - Payment request với orderId, returnUrl, cancelUrl, amount, promotionCode (optional)
 * @returns Payment response với checkoutUrl để redirect
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

/**
 * Xử lý thanh toán tiền mặt
 * Backend sẽ validate và áp dụng promotion (nếu có promotionCode)
 *
 * @param request - Cash payment request với orderId, amountReceived, promotionCode (optional)
 * @returns Cash payment response với thông tin giao dịch
 */
export const processCashPayment = async (
  request: CashPaymentRequestDTO
): Promise<CashPaymentResponseDTO> => {
  const response = await api.post<CashPaymentResponseDTO>(
    "/payments/cash",
    request
  );
  return response.data;
};
