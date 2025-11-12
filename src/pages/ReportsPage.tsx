import { useEffect, useState } from "react";
import {
  TrendingUp,
  DollarSign,
  Users,
  Download,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  getDailyReport,
  getRevenueLast7Days,
  getTopItemsLast7Days,
  getTopCustomers,
  getPeakHours,
  DailyReport,
  RevenueDay,
  TopItem,
  TopCustomer,
  PeakHour,
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
  Legend,
} from "recharts";
import MetricCard from "@/components/ui/MetricCard";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const COLORS = [
  "#4F46E5", // Indigo
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#3B82F6", // Blue
  "#8B5CF6", // Violet
  "#14B8A6", // Teal
];

const ReportsPage = () => {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState("7d");
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [salesData, setSalesData] = useState<RevenueDay[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [peakHours, setPeakHours] = useState<PeakHour[]>([]);
  const [loading, setLoading] = useState(true);

  const [showSalesChart, setShowSalesChart] = useState(true);
  const [showTopItemsChart, setShowTopItemsChart] = useState(true);
  const [showTopCustomersChart, setShowTopCustomersChart] = useState(true);
  const [showPeakHoursChart, setShowPeakHoursChart] = useState(true);

  // 🧾 Hàm export PDF
  const handleExportPDF = async () => {
    try {
      const reportSection = document.getElementById("report-content");
      if (!reportSection) return;

      const canvas = await html2canvas(reportSection, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.text("Restaurant Report", 10, 10);
      pdf.addImage(imgData, "PNG", 0, 15, pdfWidth, pdfHeight);
      pdf.text(
        `Generated: ${new Date().toLocaleString()}`,
        10,
        pdf.internal.pageSize.getHeight() - 10
      );

      pdf.save(`report_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      toast({
        title: "Export Failed",
        description: "Could not generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  // 🕒 Tính khoảng thời gian
  const calculateRange = () => {
    const end = new Date();
    const start = new Date();

    if (timeRange === "today") start.setHours(0, 0, 0, 0);
    else if (timeRange === "7d") start.setDate(end.getDate() - 7);
    else if (timeRange === "30d") start.setDate(end.getDate() - 30);
    else if (timeRange === "3m") start.setMonth(end.getMonth() - 3);

    return {
      start: start.toISOString().split(".")[0],
      end: end.toISOString().split(".")[0],
    };
  };

  // 📊 Fetch dữ liệu
  const fetchData = async () => {
    setLoading(true);
    try {
      const { start, end } = calculateRange();
      const days =
        timeRange === "today"
          ? 1
          : timeRange === "7d"
          ? 7
          : timeRange === "30d"
          ? 30
          : 90;

      const [daily, revenue, top, customers, hours] = await Promise.all([
        getDailyReport(start, end),
        getRevenueLast7Days(),
        getTopItemsLast7Days(),
        getTopCustomers(days),
        getPeakHours(days),
      ]);

      setDailyReport(daily);
      setSalesData(revenue);
      setTopItems(top);
      setTopCustomers(customers);
      setPeakHours(hours);
    } catch (error) {
      console.error(error);
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
  }, [timeRange]);

  const metrics = [
    {
      title: "Total Revenue",
      value: `$${dailyReport?.totalRevenue?.toLocaleString() ?? 0}`,
      icon: DollarSign,
      changeType: "positive" as const,
    },
    {
      title: "Total Orders",
      value: dailyReport?.totalOrders ?? 0,
      icon: BarChart3,
      changeType: "positive" as const,
    },
    {
      title: "Avg Order Value",
      value: `$${dailyReport?.avgOrderValue?.toFixed(2) ?? 0}`,
      icon: TrendingUp,
      changeType: "neutral" as const,
    },
    {
      title: "Customer Visits",
      value: dailyReport?.customerVisits ?? 0,
      icon: Users,
      changeType: "positive" as const,
    },
  ];

  return (
    <div id="report-content" className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Track performance and analyze real data.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Select Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Metrics */}
      {loading ? (
        <p className="text-muted-foreground text-center py-10">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((m, i) => (
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

      {/* Charts Section 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue */}
        <Card className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Revenue Overview
            </h3>
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
                <Bar dataKey="revenue" fill="#4F46E5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Top Items */}
        <Card className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-foreground">Top Items</h3>
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
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  labelLine={false}
                  label={({ name, revenue }) =>
                    `${name}: ${revenue.toLocaleString()}₫`
                  }
                  dataKey="revenue"
                >
                  {topItems.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Charts Section 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <Card className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Top Customers
            </h3>
            <Button
              variant="ghost"
              onClick={() => setShowTopCustomersChart(!showTopCustomersChart)}
              size="sm"
            >
              {showTopCustomersChart ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              {showTopCustomersChart ? "Hide" : "Show"}
            </Button>
          </div>
          {showTopCustomersChart && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={topCustomers}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" />
                <Tooltip formatter={(v: number) => `${v.toLocaleString()}₫`} />
                <Bar
                  dataKey="revenue"
                  fill="#F59E0B"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Peak Hours */}
        <Card className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Peak Hours
            </h3>
            <Button
              variant="ghost"
              onClick={() => setShowPeakHoursChart(!showPeakHoursChart)}
              size="sm"
            >
              {showPeakHoursChart ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              {showPeakHoursChart ? "Hide" : "Show"}
            </Button>
          </div>
          {showPeakHoursChart && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} />
                <YAxis />
                <Tooltip formatter={(v: number) => `${v.toLocaleString()}₫`} />
                <Bar dataKey="revenue" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;
