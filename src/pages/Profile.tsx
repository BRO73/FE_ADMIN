import { useAuthUser } from "@/hooks/useAuthUser";
import { useNavigate } from "react-router-dom";
import { User, Phone, Mail, Shield, Search } from "lucide-react";

const Profile = () => {
  const user = useAuthUser();
  const navigate = useNavigate();

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

  const handleGoBack = () => {
    navigate(-1);
  };

  // Lấy chữ cái đầu cho avatar
  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header với Welcome và ngày */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.fullName?.split(' ')[0] || 'User'}</h1>
          <p className="text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'short', 
              day: '2-digit', 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Avatar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">
                    {getInitials(user.fullName)}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{user.fullName}</h2>
                <p className="text-gray-500 text-sm mt-1">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Right Column - Thông tin chi tiết */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200">
              {/* Personal Information Section */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{user.fullName}</p>
                    </div>
                  </div>

                  {/* Nick Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nick Name</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{user.username}</p>
                    </div>
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-00">Viet Nam</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Section */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">My email Address</h3>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <p className="font-medium text-gray-900">{user.email}</p>
                    <p className="text-sm text-gray-500 mt-1">1 month ago</p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
                    +Add Email Address
                  </button>
                </div>
              </div>

              {/* Contact Information - Giữ nguyên từ code cũ nhưng style mới */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-4">
                  {/* Phone - Giữ nguyên logic từ code cũ */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Phone</p>
                        <p className="text-gray-900">{user.phoneNumber || "Chưa cập nhật"}</p>
                        {!user.phoneNumber && (
                          <p className="text-xs text-gray-500 mt-1">Thêm số điện thoại để bảo mật tốt hơn</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Role - Giữ nguyên logic từ code cũ */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Role</p>
                        <p className="text-gray-900">{user.roles}</p>
                      </div>
                    </div>
                    <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      Quyền hạn
                    </span>
                  </div>

                  {/* Email - Giữ nguyên logic từ code cũ */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Email</p>
                        <p className="text-gray-900">{user.email}</p>
                      </div>
                    </div>
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      Đã xác thực
                    </span>
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200">
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;