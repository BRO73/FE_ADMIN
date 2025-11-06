import { useEffect, useState } from "react";
import {
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Download,
  BarChart3,
  Activity,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  getDailyReport,
  getRevenueLast7Days,
  getTopItemsLast7Days,
  DailyReport,
  RevenueDay,
  TopItem,
} from "@/api/report.api";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import MetricCard from "@/components/ui/MetricCard";

const ReportsPage = () => {
  const { toast } = useToast();
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [salesData, setSalesData] = useState<RevenueDay[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSalesChart, setShowSalesChart] = useState(true);
  const [showTopItemsChart, setShowTopItemsChart] = useState(true);

  const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 7);

      const [daily, revenue, top] = await Promise.all([
        getDailyReport(
          start.toISOString().split(".")[0],
          end.toISOString().split(".")[0]
        ),
        getRevenueLast7Days(),
        getTopItemsLast7Days(),
      ]);

      setDailyReport(daily);
      setSalesData(revenue);
      setTopItems(top);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load reports.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const weeklyMetrics = [
    {
      title: "Total Revenue",
      value: `$${dailyReport?.totalRevenue?.toLocaleString() ?? 0}`,
      changeType: "positive" as const,
      icon: DollarSign,
    },
    {
      title: "Total Orders",
      value: dailyReport?.totalOrders ?? 0,
      changeType: "positive" as const,
      icon: BarChart3,
    },
    {
      title: "Avg Order Value",
      value: `$${dailyReport?.avgOrderValue?.toFixed(2) ?? 0}`,
      changeType: "negative" as const,
      icon: TrendingUp,
    },
    {
      title: "Customer Visits",
      value: dailyReport?.customerVisits ?? 0,
      changeType: "positive" as const,
      icon: Users,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track performance and analyze real business data.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Metrics */}
      {loading ? (
        <p className="text-muted-foreground">Loading metrics...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {weeklyMetrics.map((m, i) => (
            <MetricCard
              key={i}
              title={m.title}
              value={m.value}
              changeType={m.changeType}
              icon={m.icon}
            />
          ))}
        </div>
      )}

      {/* Sales Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="dashboard-card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Revenue Last 7 Days</h3>
            <Button
              variant="ghost"
              onClick={() => setShowSalesChart(!showSalesChart)}
              size="sm"
            >
              {showSalesChart ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              {showSalesChart ? "Hide" : "Show"}
            </Button>
          </div>
          {showSalesChart && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="dashboard-card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Top Items (7 Days)</h3>
            <Button
              variant="ghost"
              onClick={() => setShowTopItemsChart(!showTopItemsChart)}
              size="sm"
            >
              {showTopItemsChart ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              {showTopItemsChart ? "Hide" : "Show"}
            </Button>
          </div>
          {showTopItemsChart && (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topItems}
                  dataKey="revenue"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, revenue }) => `${name}`}
                >
                  {topItems.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;

