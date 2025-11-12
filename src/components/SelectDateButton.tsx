import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {useState} from "react";

export const SelectDateButton = ({ onSelectDate }: { onSelectDate: (date: string) => void }) => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [open, setOpen] = useState(false)

    const handleSelect = (selectedDate: Date | undefined) => {
        if (!selectedDate) return;
        setDate(selectedDate);
        setOpen(false);
        const formatted = format(selectedDate, "yyyy-MM-dd");
        onSelectDate(formatted);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => setOpen(true)}
                >
                    <CalendarIcon className="w-4 h-4" />
                    {date ? format(date, "dd/MM/yyyy") : "Pick a date"}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-0">
                <Calendar mode="single" selected={date} onSelect={handleSelect} initialFocus />
            </PopoverContent>
        </Popover>
    );
};
