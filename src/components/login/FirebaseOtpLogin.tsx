import { isAxiosError } from "axios";

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

import React, { useEffect, useRef, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import api from "@/api/axiosInstance"; 

const firebaseConfig = {
  apiKey: "AIzaSyCkI-cejUKdK7AWEAHAcBDpO5UGGzigTGU",
  authDomain: "otp-sms-58177.firebaseapp.com",
  projectId: "otp-sms-58177",
  storageBucket: "otp-sms-58177.firebasestorage.app",
  messagingSenderId: "201395098559",
  appId: "1:201395098559:web:0dbb3407ad17051628c70a",
  measurementId: "G-Y0920K5QQ3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = "vi";

const FirebaseOtpLogin: React.FC = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp" | "register">("phone");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const confirmationResultRef = useRef<any>(null);

  const log = (msg: string) => setMessage(msg);

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "normal",
      });
      window.recaptchaVerifier.render();
    }
  }, []);

  // 📨 Gửi OTP
  const sendOtp = async () => {
    if (!phone) return log("Nhập số điện thoại.");
    let e164 = phone;
    if (phone.startsWith("0")) e164 = "+84" + phone.substring(1);
    else if (!phone.startsWith("+84")) e164 = "+84" + phone;

    setLoading(true);
    log("Đang gửi OTP...");
    try {
      const result = await signInWithPhoneNumber(auth, e164, window.recaptchaVerifier);
      confirmationResultRef.current = result;
      setStep("otp");
      log("Đã gửi OTP. Kiểm tra tin nhắn SMS.");
    } catch (e: any) {
      log("Gửi OTP thất bại: " + (e.message || e));
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.render();
      }
    } finally {
      setLoading(false);
    }
  };

// ✅ Xác thực OTP
const verifyOtp = async () => {
  const confirmationResult = confirmationResultRef.current;
  if (!confirmationResult || !otp) return log("Thiếu mã OTP.");
  setLoading(true);
  log("Đang xác thực...");
  try {
    const result = await confirmationResult.confirm(otp);
    const user = result.user;
    const idToken = await user.getIdToken(true);

    const resp = await api.post(`/auth/verify-firebase?idToken=${encodeURIComponent(idToken)}`);
    const data: { 
      accessToken?: string; 
      registrationToken?: string;
    } = resp.data;

    // ▼▼▼ LOGIC XỬ LÝ MỚI - KHÔNG CÒN LẠM DỤNG CATCH ▼▼▼

    // Trường hợp 1: Người dùng cũ (server trả về accessToken)
    if (data.accessToken) {
      localStorage.setItem("accessToken", data.accessToken);
      log("Đăng nhập thành công!");
      window.location.href = "/dashboard";
    } 
    // Trường hợp 2: Người dùng mới (server trả về registrationToken)
    else if (data.registrationToken) {
      // Lưu token đăng ký này vào localStorage.
      // Dùng chung key "accessToken" là một mẹo hay để hàm registerProfile không cần thay đổi.
      localStorage.setItem("accessToken", data.registrationToken);
      
      log("Xác thực thành công. Vui lòng hoàn tất hồ sơ.");
      setStep("register");
    } 
    else {
      throw new Error("Phản hồi từ máy chủ không hợp lệ.");
    }

  } catch (e: any) {
    // Khối catch này bây giờ chỉ xử lý các lỗi ngoại lệ thực sự.
    const errorMessage = isAxiosError(e) 
      ? e.response?.data?.message || e.message 
      : (e.message || "Đã có lỗi xảy ra.");
    log("Xác thực thất bại: " + errorMessage);
  } finally {
    setLoading(false);
  }
};

// 👤 Đăng ký profile
const registerProfile = async () => {
  if (!fullName) return log("Nhập họ tên.");
  setLoading(true);
  log("Đang xử lý...");
  try {
    // Nó sẽ lấy `registrationToken` đã được lưu dưới key "accessToken"
    const token = localStorage.getItem("accessToken");
    
    if (!token) {
       // Ném ra một Error thực sự, không phải object tự tạo
       throw new Error("Phiên đăng ký không hợp lệ. Vui lòng thử lại từ đầu.");
    }
    
    const resp = await api.post(
      "/auth/register-customer",
      { phoneNumber: phone, fullName, email, address },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // TỐI ƯU: Sau khi đăng ký thành công, backend nên trả về accessToken và refreshToken mới
    // để người dùng được đăng nhập ngay lập tức.
    if (resp.data.accessToken) {
        localStorage.setItem("accessToken", resp.data.accessToken);
    }

    log("Hoàn tất! Tài khoản đã được tạo.");
    window.location.href = "/dashboard";
    
  } catch (e: any) {
    // Lỗi ở đây có thể là do validation (ví dụ email trùng) hoặc registrationToken hết hạn (401).
    if (isAxiosError(e) && e.response?.status === 401) {
      log("Phiên đăng ký đã hết hạn. Vui lòng thực hiện lại từ đầu.");
      // Rollback về bước đầu tiên
      localStorage.removeItem("accessToken");
      setStep("phone");
      // ... reset các state khác
    } else {
      const errorMessage = isAxiosError(e) ? e.response?.data?.message || e.message : e.message || "Lỗi không xác định";
      log("Đăng ký thất bại: " + errorMessage);
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-md space-y-4">
        <h1 className="text-2xl font-bold text-center mb-4">
          Đăng nhập bằng OTP (Firebase)
        </h1>

        {step === "phone" && (
          <>
            <input
              type="tel"
              placeholder="0xxxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring"
            />
            <div id="recaptcha-container" className="my-2 flex justify-center"></div>
            <button
              onClick={sendOtp}
              disabled={loading}
              className="w-full py-2 bg-black text-white rounded-2xl hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Đang gửi..." : "Gửi OTP"}
            </button>
          </>
        )}

        {step === "otp" && (
          <>
            <input
              type="number"
              placeholder="Nhập mã OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full border rounded-xl px-3 py-2"
            />
            <button
              onClick={verifyOtp}
              disabled={loading}
              className="w-full py-2 bg-black text-white rounded-2xl hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Đang xác thực..." : "Xác thực & Đăng nhập"}
            </button>
          </>
        )}

        {step === "register" && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Hoàn tất hồ sơ</h2>
            <input
              type="text"
              placeholder="Họ tên (*)"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border rounded-xl px-3 py-2"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-xl px-3 py-2"
            />
            <input
              type="text"
              placeholder="Địa chỉ"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border rounded-xl px-3 py-2"
            />
            <button
              onClick={registerProfile}
              disabled={loading}
              className="w-full py-2 bg-black text-white rounded-2xl hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Đang lưu..." : "Lưu thông tin"}
            </button>
          </div>
        )}

        {message && <p className="text-sm text-gray-600 text-center">{message}</p>}
      </div>
    </div>
  );
};

export default FirebaseOtpLogin;