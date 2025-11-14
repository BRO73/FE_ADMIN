import { useAuthUser } from "@/hooks/useAuthUser";
import { useNavigate } from "react-router-dom";
import { User, Phone, Mail, Shield, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { updateProfile } from "@/api/profile.api";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const user = useAuthUser();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [editing, setEditing] = useState(false);

  // Form state
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
  });

  // 🟢 Sync form whenever user data changes
  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
      });
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return (
      name
        ?.split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U"
    );
  };

  const handleSave = async () => {
    try {
      await updateProfile(form);

      toast({
        title: "Cập nhật thành công",
        description: "Thông tin cá nhân đã được cập nhật.",
      });

      setEditing(false);
      window.location.reload();
    } catch (err: any) {
      toast({
        title: "Lỗi cập nhật",
        description: err.message || "Không thể cập nhật hồ sơ.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    // 🟡 Reset lại dữ liệu cũ khi nhấn Cancel
    setForm({
      fullName: user.fullName || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
    });

    setEditing(false);
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {user.fullName?.split(" ")[0]}
          </h1>
          <p className="text-gray-500 mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "short",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Avatar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">
                    {getInitials(user.fullName)}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {user.fullName}
                </h2>
                <p className="text-gray-500 text-sm mt-1">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200">
              {/* Personal Info */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Personal Information
                </h3>

                {!editing ? (
                  // ===== VIEW MODE =====
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        {user.fullName}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nick Name
                      </label>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        {user.username}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country
                      </label>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        Viet Nam
                      </div>
                    </div>
                  </div>
                ) : (
                  // ===== EDIT MODE =====
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        className="w-full p-3 bg-white border rounded-lg"
                        value={form.fullName}
                        onChange={(e) =>
                          setForm({ ...form, fullName: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        className="w-full p-3 bg-white border rounded-lg"
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        className="w-full p-3 bg-white border rounded-lg"
                        value={form.phoneNumber}
                        onChange={(e) =>
                          setForm({ ...form, phoneNumber: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <Phone className="w-5 h-5 text-gray-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Phone</p>
                      <p className="text-gray-900">{user.phoneNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <Shield className="w-5 h-5 text-gray-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Role</p>
                      <p className="text-gray-900">{user.roles}</p>
                    </div>
                  </div>

                  <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <Mail className="w-5 h-5 text-gray-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Email</p>
                      <p className="text-gray-900">{user.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium"
                    >
                      Save Changes
                    </button>

                    <button
                      onClick={handleCancel}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-900 px-6 py-3 rounded-lg font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
