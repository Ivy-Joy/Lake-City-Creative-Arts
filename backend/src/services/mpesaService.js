// Minimal M-PESA service; default is a dev stub.
// TODO: For production, implement Daraja auth + STK push call with axios and replace stubs.
import config from "../config/config";
const isProd = config.NODE_ENV === "production";

export async function stkPush({ phone, amount, accountReference, transactionDesc }) {
  if (!isProd) {
    return {
      MerchantRequestID: "stub-merchant-id",
      CheckoutRequestID: "stub-checkout-id",
      ResponseCode: "0",
      CustomerMessage: "Success. Request accepted for processing",
    };
  }

  // TODO: Implement Daraja auth + STK push call with axios
  throw new Error("M-PESA production integration not implemented");
}
