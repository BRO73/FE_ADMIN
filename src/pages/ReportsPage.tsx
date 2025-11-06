import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  Download,
  BarChart3,
  Activity,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useState } from "react";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import MetricCard from "@/components/ui/MetricCard";

const ReportsPage = () => {
  const [showSalesChart, setShowSalesChart] = useState(false);
  const [showTopItemsChart, setShowTopItemsChart] = useState(false);
  const [showPeakHoursChart, setShowPeakHoursChart] = useState(false);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  // Mock data for demonstration
  const salesData = [
    { period: "Today", revenue: 2847, orders: 42, avgOrder: 67.79 },
    { period: "Yesterday", revenue: 2315, orders: 38, avgOrder: 60.92 },
    { period: "This Week", revenue: 18920, orders: 287, avgOrder: 65.89 },
    { period: "Last Week", revenue: 16745, orders: 251, avgOrder: 66.71 },
    { period: "This Month", revenue: 89650, orders: 1342, avgOrder: 66.81 },
    { period: "Last Month", revenue: 82340, orders: 1198, avgOrder: 68.74 },
  ];

  const topItems = [
    { name: "Grilled Salmon", orders: 156, revenue: 4521 },
    { name: "Caesar Salad", orders: 143, revenue: 1857 },
    { name: "Truffle Pasta", orders: 89, revenue: 3201 },
    { name: "Craft Beer", orders: 234, revenue: 1636 },
    { name: "Chocolate Cake", orders: 98, revenue: 881 },
  ];

  const peakHours = [
    { hour: "12:00 PM", orders: 28 },
    { hour: "1:00 PM", orders: 35 },
    { hour: "7:00 PM", orders: 42 },
    { hour: "8:00 PM", orders: 38 },
    { hour: "9:00 PM", orders: 31 },
  ];

  const weeklyMetrics = [
    {
      title: "Total Revenue",
      value: "$18,920",
      change: "+12.9% vs last week",
      changeType: "positive" as const,
      icon: DollarSign,
    },
    {
      title: "Total Orders",
      value: 287,
      change: "+14.3% vs last week",
      changeType: "positive" as const,
      icon: BarChart3,
    },
    {
      title: "Avg Order Value",
      value: "$65.89",
      change: "-1.2% vs last week",
      changeType: "negative" as const,
      icon: TrendingUp,
    },
    {
      title: "Customer Visits",
      value: 498,
      change: "+8.7% vs last week",
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
            Track performance, analyze trends, and make data-driven decisions.
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {weeklyMetrics.map((metric, index) => (
          <MetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            change={metric.change}
            changeType={metric.changeType}
            icon={metric.icon}
          />
        ))}
      </div>

      {/* Sales Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="dashboard-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Sales Overview</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSalesChart(!showSalesChart)}
              className="gap-2"
            >
              {showSalesChart ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showSalesChart ? 'Hide Chart' : 'View Chart'}
            </Button>
          </div>
          
          {showSalesChart ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem'
                  }} 
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="space-y-4">
              {salesData.map((data, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{data.period}</p>
                    <p className="text-sm text-muted-foreground">{data.orders} orders</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">${data.revenue.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Avg: ${data.avgOrder}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="dashboard-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Top Selling Items</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTopItemsChart(!showTopItemsChart)}
              className="gap-2"
            >
              {showTopItemsChart ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showTopItemsChart ? 'Hide Chart' : 'View Chart'}
            </Button>
          </div>
          
          {showTopItemsChart ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topItems}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, revenue }) => `${name}: $${revenue}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {topItems.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="space-y-4">
              {topItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-sm font-medium text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.orders} orders</p>
                    </div>
                  </div>
                  <p className="font-medium text-foreground">${item.revenue.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="dashboard-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Peak Hours</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPeakHoursChart(!showPeakHoursChart)}
              className="gap-2"
            >
              {showPeakHoursChart ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showPeakHoursChart ? 'Hide Chart' : 'View Chart'}
            </Button>
          </div>
          
          {showPeakHoursChart ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem'
                  }} 
                />
                <Bar dataKey="orders" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="space-y-4">
              {peakHours.map((hour, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{hour.hour}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(hour.orders / 50) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground">{hour.orders}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="dashboard-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Performance Summary</h3>
          </div>
          <div className="space-y-6">
            <div className="text-center p-6 bg-success/10 rounded-lg">
              <TrendingUp className="w-8 h-8 text-success mx-auto mb-2" />
              <h4 className="text-lg font-semibold text-foreground">Revenue Growth</h4>
              <p className="text-2xl font-bold text-success">+18.2%</p>
              <p className="text-sm text-muted-foreground">vs last month</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">New Customers</p>
                <p className="text-xl font-bold text-primary">127</p>
              </div>
              <div className="text-center p-4 bg-amber-100 rounded-lg">
                <Activity className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Avg Service Time</p>
                <p className="text-xl font-bold text-amber-600">18m</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;
