// src/pages/MenuAvailabilityPage.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { fetchAllMenuItemsLite, setMenuAvailability, type MenuItemLite } from "@/api/menuAvailability.api";

export default function MenuAvailabilityPage(): JSX.Element {
    const [items, setItems] = useState<MenuItemLite[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [search, setSearch] = useState<string>("");

    const load = useCallback(async (): Promise<void> => {
        try {
            setLoading(true);
            const data = await fetchAllMenuItemsLite();
            setItems(data);
        } catch {
            toast({ variant: "destructive", title: "Tải danh sách món thất bại" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const filtered = useMemo<MenuItemLite[]>(() => {
        const q = search.trim().toLowerCase();
        return !q ? items : items.filter((x) => x.name.toLowerCase().includes(q));
    }, [items, search]);

    const toggle = useCallback(async (id: number, next: boolean) => {
        try {
            await setMenuAvailability(id, next);
            setItems((prev) => prev.map((x) => (x.id === id ? { ...x, available: next } : x)));
            toast({ title: next ? "Đã bật món" : "Đã tắt món" });
        } catch {
            toast({ variant: "destructive", title: "Cập nhật trạng thái thất bại" });
        }
    }, []);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Trạng thái món</h1>
                <Button variant="outline" onClick={() => void load()} disabled={loading}>
                    {loading ? <Loader2 className="animate-spin mr-2" /> : <RefreshCcw className="mr-2" />}
                    Làm mới
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Tất cả món</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-3">
                        <Input placeholder="Tìm theo tên món..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Tên món</TableHead>
                                <TableHead>Giá</TableHead>
                                <TableHead className="text-right">Có bán</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((x) => (
                                <TableRow key={x.id}>
                                    <TableCell>{x.id}</TableCell>
                                    <TableCell>{x.name}</TableCell>
                                    <TableCell>{x.price.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Switch checked={x.available} onCheckedChange={(v) => void toggle(x.id, v)} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
