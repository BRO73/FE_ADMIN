import { useState } from "react";
import { Link } from "react-router-dom";
import AuthHeader from "@/components/login/AuthHeader";
import AuthFooter from "@/components/login/AuthFooter";
import FloatingInput from "@/components/login/FloatingInput";
import LoadingButton from "@/components/login/LoadingButton";
import { useToast } from "@/hooks/use-toast";

const Register = () => {
  const [formData, setFormData] = useState({
    storeName: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "WAITSTAFF", // mặc định
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.storeName.trim()) {
      newErrors.storeName = "Tên cửa hàng không được để trống";
    }
    if (!formData.username.trim()) {
      newErrors.username = "Tên đăng nhập không được để trống";
    } else if (formData.username.length < 3) {
      newErrors.username = "Tên đăng nhập phải có ít nhất 3 ký tự";
    }
    if (!formData.password) {
      newErrors.password = "Mật khẩu không được để trống";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch("http://localhost:8082/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // ✅ KHÔNG GỬI confirmPassword
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          storeName: formData.storeName,
          role: formData.role,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Đăng ký thất bại");
      }

      const data = await response.json();

      toast({
        title: "🎉 Đăng ký thành công!",
        description: data.message || `Chào mừng ${formData.username} gia nhập hệ thống.`,
      });

      // reset form sau khi đăng ký
      setFormData({
        storeName: "",
        username: "",
        password: "",
        confirmPassword: "",
        role: "WAITSTAFF",
      });
    } catch (error: any) {
      toast({
        title: "Đăng ký thất bại",
        description: error.message || "Có lỗi xảy ra, vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md">
        <AuthHeader />

        <div className="auth-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <FloatingInput
              name="storeName"
              type="text"
              label="Tên cửa hàng"
              value={formData.storeName}
              onChange={handleInputChange}
              error={errors.storeName}
            />

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

            <FloatingInput
              name="confirmPassword"
              type="password"
              label="Xác nhận mật khẩu"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={errors.confirmPassword}
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium">Vai trò</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full border rounded-md p-2 focus:ring focus:ring-primary focus:outline-none"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="WAITSTAFF">WAITSTAFF</option>
                <option value="KITCHEN_STAFF">KITCHEN_STAFF</option>
                <option value="CASHIER">CASHIER</option>
              </select>
            </div>

            <div className="pt-4">
              <LoadingButton type="submit" loading={loading}>
                Đăng ký
              </LoadingButton>
            </div>
          </form>

          <div className="text-center mt-6">
            <Link to="/login" className="btn-link">
              Đã có tài khoản? Đăng nhập ngay
            </Link>
          </div>
        </div>

        <AuthFooter />
      </div>
    </div>
  );
};

export default Register;
