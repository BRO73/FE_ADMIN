import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthHeader from "@/components/login/AuthHeader";
import AuthFooter from "@/components/login/AuthFooter";
import FloatingInput from "@/components/login/FloatingInput";
import LoadingButton from "@/components/login/LoadingButton";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error khi user nhập lại
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = "Tên đăng nhập không được để trống";
    }
    if (!formData.password) {
      newErrors.password = "Mật khẩu không được để trống";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:8082/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();

      // ✅ Lưu token vào localStorage
      localStorage.setItem("accessToken", data.data.accessToken);
      localStorage.setItem("refreshToken", data.data.refreshToken);

      toast({
        title: "Đăng nhập thành công!",
        description: `Chào mừng ${formData.username} quay trở lại.`,
      });

      // 👉 Điều hướng sang dashboard (hoặc trang chủ)
      navigate("/admin");

    } catch (error) {
      toast({
        title: "Đăng nhập thất bại",
        description: "Vui lòng kiểm tra lại thông tin đăng nhập.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-login flex flex-col items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md">
        <AuthHeader />

        <div className="auth-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <FloatingInput
              name="username"
              type="text"
              label="Tên đăng nhập"
              value={formData.username}
              onChange={handleInputChange}
              error={errors.username}
            />

            <FloatingInput
              name="password"
              type="password"
              label="Mật khẩu"
              value={formData.password}
              onChange={handleInputChange}
              error={errors.password}
            />

            <div className="pt-4">
              <LoadingButton type="submit" loading={loading}>
                Đăng nhập
              </LoadingButton>
            </div>
          </form>

          <div className="text-center mt-6">
            <Link to="/register" className="btn-link">
              Bạn chưa có tài khoản? Đăng ký ngay
            </Link>
          </div>
        </div>

        <AuthFooter />
      </div>
    </div>
  );
};

export default Login;
