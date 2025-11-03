import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";

export default function QrScanner() {
  const [status, setStatus] = useState("Scanning QR code...");
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const tableId = params.get("tableId");

    if (!tableId) {
      setStatus("Invalid QR code. Missing table ID.");
      return;
    }

    const doLogin = async () => {
      try {
        setStatus("Logging in...");

        // ❌ KHÔNG DÙNG axiosInstance ở đây
        const res = await fetch(`http://192.168.16.160:8082/api/auth/qr-login?tableId=${tableId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        });

        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }

        const data = await res.json();

        // ✅ lưu token vào localStorage
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("role", "CUSTOMER");
        localStorage.setItem("tableId", tableId);

        setStatus("Login successful! Redirecting...");
        navigate("/customer/menu");
      } catch (err) {
        console.error("QR login error:", err);
        setStatus("Failed to login. Please try again.");
      }
    };

    doLogin();
  }, [params, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="p-6 w-full max-w-md flex flex-col items-center gap-4 text-center">
        <h1 className="text-xl font-semibold">QR Login</h1>
        <p className="text-sm text-muted-foreground">{status}</p>
      </Card>
    </div>
  );
}
