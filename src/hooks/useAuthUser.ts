import { useEffect, useState } from "react";

export const useAuthUser = () => {
  const [user, setUser] = useState<any>(null);
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!token) return;

      try {
        const res = await fetch("http://localhost:8082/api/users/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        setUser(data.data); // StaffProfileResponse
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      }
    };

    fetchUserProfile();
  }, [token]);

  return user;
};
