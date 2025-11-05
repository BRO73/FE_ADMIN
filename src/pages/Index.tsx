import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BarChart3 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="mb-4 text-4xl font-bold text-foreground">Analytics Dashboard</h1>
        <p className="text-xl text-muted-foreground">View your website traffic reports and analytics</p>
        <Button 
          onClick={() => navigate('/reports')}
          size="lg"
          className="gap-2"
        >
          <BarChart3 className="w-5 h-5" />
          View Reports
        </Button>
      </div>
    </div>
  );
};

export default Index;
