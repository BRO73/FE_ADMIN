import { useState, useEffect } from "react";
import { getOrdersByStatus } from "@/api/order.api";
import { OrderResponse } from "@/types/type";

export const useOrders = () => {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);

        // Fetch cả PENDING và IN_PROGRESS
        const [pending, inProgress] = await Promise.all([
          getOrdersByStatus("PENDING"),
          getOrdersByStatus("IN_PROGRESS"),
        ]);

        setOrders([...pending, ...inProgress]);
      } catch (err: any) {
        setError(err?.message || "Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return { orders, loading, error };
};
