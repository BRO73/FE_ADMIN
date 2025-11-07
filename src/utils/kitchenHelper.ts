export const HIGHLIGHT_MS = 2500;

export function fmtTime(iso: string): string {
    const d = new Date(iso);
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    return `${hh}:${mm}`;
}

export function normStatus(s?: string): "PENDING" | "IN_PROGRESS" | "DONE" | "CANCELED" | string {
    return (s || "").trim().toUpperCase().replace(/[-\s]+/g, "_");
}

export function isPending(s?: string): boolean {
    return normStatus(s) === "PENDING";
}

export function isInProgress(s?: string): boolean {
    return normStatus(s) === "IN_PROGRESS";
}

export function canCancel(s?: string): boolean {
    const n = normStatus(s);
    return n === "PENDING" || n === "IN_PROGRESS";
}

export function confirmCancel(run: () => void): void {
    if (window.confirm("Bạn chắc chắn muốn hủy món này?")) run();
}

export function formatTimeAgo(isoString: string, serverNowMs: number): string {
    const time = Date.parse(isoString);
    const diffInSeconds = Math.floor((serverNowMs - time) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    
    if (diffInMinutes > 0) {
        return `${diffInMinutes} phút trước`;
    } else {
        return 'Vài giây trước';
    }
}

export function formatDisplayDate(isoString: string): string {
    const date = new Date(isoString);
    return `49-9 - ${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} - Bộ Admin`;
}