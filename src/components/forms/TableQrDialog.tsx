import { useMemo, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { TableResponse } from "@/types/type";
import { QRCodeCanvas } from "qrcode.react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: TableResponse | null;
};

const baseQrUrl =
  // Dùng URL public để điện thoại quét (ngrok/domain). Có thể set trong .env
  import.meta.env.VITE_QR_BASE_URL;

export default function TableQrDialog({ open, onOpenChange, table }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const qrUrl = useMemo(() => {
    if (!table) return "";
    return `${baseQrUrl}/scan?tableId=${table.id}`;
  }, [table]);

  const handleCopy = async () => {
    if (!qrUrl) return;
    await navigator.clipboard.writeText(qrUrl);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pngUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = `table_${table?.tableNumber}_qr.png`;
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>QR Code — {table?.tableNumber}</DialogTitle>
          <DialogDescription>Khách quét QR này để login vào bàn {table?.tableNumber}.</DialogDescription>
        </DialogHeader>

        <Card className="p-4 flex flex-col items-center gap-4">
          {qrUrl && (
            <QRCodeCanvas
              value={qrUrl}
              size={220}
              includeMargin
              level="M"
              ref={canvasRef}
            />
          )}
          <p className="text-xs text-muted-foreground break-all text-center">{qrUrl}</p>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopy}>Copy link</Button>
            <Button onClick={handleDownload}>Download PNG</Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Tip: set <code>VITE_QR_BASE_URL</code> trong <code>.env</code> để dùng domain public (ngrok / production).
          </p>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
