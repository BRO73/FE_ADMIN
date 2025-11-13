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
  ShoppingCart,
  Clock,
  Star,
  Crown,
  Zap,
  MessageSquare,
  AlertTriangle,
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
  getLowRatingReviews,
  DailyReport,
  RevenueDay,
  TopItem,
  TopCustomer,
  PeakHour,
  LowRatingReview,
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
  LineChart,
  Line,
  AreaChart,
  Area,
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
  "#F97316", // Orange
  "#EC4899", // Pink
  "#84CC16", // Lime
];

const ReportsPage = () => {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState("7d");
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [salesData, setSalesData] = useState<RevenueDay[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [peakHours, setPeakHours] = useState<PeakHour[]>([]);
  const [lowRatingReviews, setLowRatingReviews] = useState<LowRatingReview[]>([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  console.log("Top Items Data:", topItems);
}, [topItems]);


  const [showSalesChart, setShowSalesChart] = useState(true);
  const [showTopItemsChart, setShowTopItemsChart] = useState(true);
  const [showTopCustomersChart, setShowTopCustomersChart] = useState(true);
  const [showPeakHoursChart, setShowPeakHoursChart] = useState(true);
  const [showLowRatingReviews, setShowLowRatingReviews] = useState(true);

  // 🧾 Hàm export PDF
  const handleExportPDF = async () => {
    try {
      const reportSection = document.getElementById("report-content");
      if (!reportSection) return;

      toast({
        title: "Generating PDF",
        description: "Please wait while we prepare your report...",
      });

      const canvas = await html2canvas(reportSection, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Add header
      pdf.setFillColor(79, 70, 229);
      pdf.rect(0, 0, pdfWidth, 20, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.text("Restaurant Analytics Report", pdfWidth / 2, 12, { align: 'center' });
      
      // Add content
      pdf.addImage(imgData, "PNG", 0, 25, pdfWidth, pdfHeight - 25);
      
      // Add footer
      pdf.setFillColor(249, 250, 251);
      pdf.rect(0, pdf.internal.pageSize.getHeight() - 15, pdfWidth, 15, 'F');
      pdf.setTextColor(107, 114, 128);
      pdf.setFontSize(10);
      pdf.text(
        `Generated on ${new Date().toLocaleString()}`,
        10,
        pdf.internal.pageSize.getHeight() - 8
      );

      pdf.save(`restaurant_report_${new Date().toISOString().split("T")[0]}.pdf`);
      
      toast({
        title: "PDF Exported",
        description: "Your report has been downloaded successfully.",
      });
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

      const [daily, revenue, top, customers, hours, lowReviews] = await Promise.all([
        getDailyReport(start, end),
        getRevenueLast7Days(),
        getTopItemsLast7Days(),
        getTopCustomers(days),
        getPeakHours(days),
        getLowRatingReviews(), // Thêm API call mới
      ]);

      setDailyReport(daily);
      setSalesData(revenue);
      setTopItems(top);
      setTopCustomers(customers);
      setPeakHours(hours);
      setLowRatingReviews(lowReviews);
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
      color: "bg-gradient-to-br from-green-500 to-emerald-600",
      description: "Total revenue generated",
    },
    {
      title: "Total Orders",
      value: dailyReport?.totalOrders ?? 0,
      icon: ShoppingCart,
      changeType: "positive" as const,
      color: "bg-gradient-to-br from-blue-500 to-cyan-600",
      description: "Number of orders processed",
    },
    {
      title: "Avg Order Value",
      value: `$${dailyReport?.avgOrderValue?.toFixed(2) ?? 0}`,
      icon: TrendingUp,
      changeType: "neutral" as const,
      color: "bg-gradient-to-br from-purple-500 to-violet-600",
      description: "Average value per order",
    },
    {
      title: "Customer Visits",
      value: dailyReport?.customerVisits ?? 0,
      icon: Users,
      changeType: "positive" as const,
      color: "bg-gradient-to-br from-orange-500 to-amber-600",
      description: "Total customer visits",
    },
  ];

  const getTopCustomerRank = (index: number) => {
    if (index === 0) return <Crown className="w-4 h-4 text-yellow-500" />;
    if (index === 1) return <Star className="w-4 h-4 text-gray-400" />;
    if (index === 2) return <Star className="w-4 h-4 text-amber-600" />;
    return <span className="text-sm text-gray-500">#{index + 1}</span>;
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-600 bg-green-50 border-green-200";
    if (rating >= 3) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getRatingText = (rating: number) => {
    if (rating >= 4) return "Excellent";
    if (rating >= 3) return "Good";
    return "Needs Improvement";
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating 
              ? "fill-yellow-400 text-yellow-400" 
              : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      <div id="report-content" className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
            <p className="text-slate-600 mt-2 text-lg">
              Real-time insights and performance metrics for your restaurant
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px] bg-white border-slate-200 shadow-sm">
                <Calendar className="w-4 h-4 mr-2 text-slate-500" />
                <SelectValue placeholder="Select Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="3m">Last 3 Months</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={handleExportPDF}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-8 bg-slate-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, index) => (
              <Card key={index} className="p-6 bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">{metric.title}</p>
                    <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{metric.description}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${metric.color} shadow-lg`}>
                    <metric.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Charts Grid */}
        <div className="space-y-6">
          {/* Revenue & Top Items Row */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Revenue Trend</h3>
                    <p className="text-sm text-slate-600">Daily revenue performance</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setShowSalesChart(!showSalesChart)}
                  size="sm"
                  className="text-slate-600 hover:text-slate-900"
                >
                  {showSalesChart ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {showSalesChart && (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={salesData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fill: '#64748b' }} />
                    <YAxis tick={{ fill: '#64748b' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#4F46E5" fillOpacity={1} fill="url(#colorRevenue)" />
                    <Line type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={3} dot={{ fill: '#4F46E5', strokeWidth: 2, r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Top Items Chart */}
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Top Menu Items</h3>
                    <p className="text-sm text-slate-600">Best performing dishes</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setShowTopItemsChart(!showTopItemsChart)}
                  size="sm"
                  className="text-slate-600 hover:text-slate-900"
                >
                  {showTopItemsChart ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {showTopItemsChart && (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={topItems}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="revenue"
                        label={({ name, percent }) => 
                          `${name} (${(percent * 100).toFixed(1)}%)`
                        }
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
                      <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 grid grid-cols-2 gap-2 w-full max-w-xs">
                    {topItems.slice(0, 4).map((item, index) => (
                      <div key={item.id} className="flex items-center gap-2 text-sm">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-slate-700 truncate">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Customers & Peak Hours Row */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Top Customers */}
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">VIP Customers</h3>
                    <p className="text-sm text-slate-600">Top spending customers</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setShowTopCustomersChart(!showTopCustomersChart)}
                  size="sm"
                  className="text-slate-600 hover:text-slate-900"
                >
                  {showTopCustomersChart ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {showTopCustomersChart && (
                <div className="space-y-4">
                  {topCustomers.slice(0, 5).map((customer, index) => (
                    <div key={customer.id} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg border border-slate-200/50">
                      <div className="flex items-center gap-3">
                        {getTopCustomerRank(index)}
                        <div>
                          <div className="font-medium text-slate-900">{customer.name}</div>
                          <div className="text-sm text-slate-600">{customer.visitCount} visits</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">${customer.revenue.toLocaleString()}</div>
                        <div className="text-sm text-slate-600">total spent</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Peak Hours */}
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Peak Hours</h3>
                    <p className="text-sm text-slate-600">Busiest times of the day</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setShowPeakHoursChart(!showPeakHoursChart)}
                  size="sm"
                  className="text-slate-600 hover:text-slate-900"
                >
                  {showPeakHoursChart ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {showPeakHoursChart && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={peakHours}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="hour" 
                      tick={{ fill: '#64748b' }}
                      tickFormatter={(h) => `${h}:00`} 
                    />
                    <YAxis tick={{ fill: '#64748b' }} />
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="revenue" 
                      fill="url(#peakHoursGradient)" 
                      radius={[6, 6, 0, 0]}
                    />
                    <defs>
                      <linearGradient id="peakHoursGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#7C3AED" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* Low Rating Reviews Section */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center shadow-lg">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Critical Feedback</h3>
                  <p className="text-sm text-slate-600">Reviews with 3 stars or below</p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowLowRatingReviews(!showLowRatingReviews)}
                size="sm"
                className="text-slate-600 hover:text-slate-900"
              >
                {showLowRatingReviews ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
            {showLowRatingReviews && (
              <div className="space-y-4">
                {lowRatingReviews.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>No low rating reviews found. Great job!</p>
                  </div>
                ) : (
                  lowRatingReviews.map((review) => (
                    <div key={review.id} className="p-4 bg-red-50/50 border border-red-200 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <div className="font-medium text-slate-900">
                              {review.customerName || "Anonymous Customer"}
                            </div>
                            {review.customerEmail && (
                              <div className="text-sm text-slate-600">{review.customerEmail}</div>
                            )}
                            <div className="text-xs text-slate-500 mt-1">
                              Order #{review.orderId} • {new Date(review.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="bg-white px-3 py-1 rounded-full border border-red-200 flex items-center gap-1">
                            {renderStars(review.ratingScore)}
                            <span className="text-sm font-bold text-red-600 ml-1">
                              {review.ratingScore}.0/5
                            </span>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getRatingColor(review.ratingScore)}`}>
                            {getRatingText(review.ratingScore)}
                          </div>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-red-100">
                        <p className="text-slate-800 leading-relaxed">{review.comment}</p>
                      </div>
                    </div>  
                  ))
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;