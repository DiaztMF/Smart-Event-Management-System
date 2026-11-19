import { Head } from "@inertiajs/react";
import { router } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { apiJson } from "@/lib/api";
import { toast } from "sonner";

type Category = {
    id: number;
    name: string;
    created_at?: string;
    updated_at?: string;
};

type Event = {
    id: number;
    title: string;
    description: string;
    category_id: number;
    event_date: string;
    quota: number;
    remaining_quota?: number;
    category?: Category | null;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
};

function isEvent(value: unknown): value is Event {
    return (
        typeof value === "object" &&
        value !== null &&
        "id" in value &&
        "title" in value &&
        "quota" in value
    );
}

function isCategory(value: unknown): value is Category {
    return (
        typeof value === "object" &&
        value !== null &&
        "id" in value &&
        "name" in value
    );
}

export default function Dashboard() {
    const [events, setEvents] = useState<Event[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [filterCategory, setFilterCategory] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const fetchCategories = async () => {
        try {
            const data = await apiJson<{ data: unknown[] }>("/api/categories");
            setCategories(data.data.filter(isCategory));
        } catch (err) {
            toast.error("Gagal memuat kategori");
        }
    };

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterCategory) params.set("category_id", filterCategory);
            const data = await apiJson<{ data: unknown[] }>(
                "/api/events?" + params.toString(),
            );
            setEvents(data.data.filter(isEvent));
        } catch (err) {
            toast.error("Gagal memuat daftar event");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchCategories();
        void fetchEvents();
    }, [filterCategory]);

    const handleRegister = async (eventId: number) => {
        try {
            await apiJson(`/api/events/${eventId}/register`, {
                method: "POST",
            });
            toast.success("Pendaftaran berhasil");
            await fetchEvents();
        } catch (err: any) {
            toast.error(err?.message ?? "Pendaftaran gagal");
        }
    };

    const filtered = events.filter((e) =>
        filterCategory ? String(e.category_id) === filterCategory : true,
    );

    const remaining = (e: Event) =>
        typeof e.remaining_quota === "number" ? e.remaining_quota : e.quota;

    return (
        <>
            <Head title="Dashboard" />
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Dashboard
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Selamat datang kembali ke sistem manajemen
                                    event
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-neutral-100 p-4 rounded-xl">
                                        <div className="text-xs text-neutral-500">
                                            Total Event
                                        </div>
                                        <div className="text-2xl font-bold">
                                            {filtered.length}
                                        </div>
                                    </div>
                                    <div className="bg-neutral-100 p-4 rounded-xl">
                                        <div className="text-xs text-neutral-500">
                                            Sisa Kuota (terpilih)
                                        </div>
                                        <div className="text-2xl font-bold">
                                            {filtered.reduce(
                                                (sum, e) => sum + remaining(e),
                                                0,
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="category" className="text-xs">
                                Kategori
                            </Label>
                            <Select
                                value={filterCategory}
                                onValueChange={setFilterCategory}
                            >
                                <SelectTrigger
                                    id="category"
                                    className="w-[180px]"
                                >
                                    <SelectValue placeholder="Semua kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">
                                        Semua Kategori
                                    </SelectItem>
                                    {categories.map((c) => (
                                        <SelectItem
                                            key={c.id}
                                            value={c.id.toString()}
                                        >
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            onClick={() => void fetchEvents()}
                            disabled={loading}
                        >
                            {loading ? "Memuat..." : "Muat Ulang"}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filtered.length === 0 ? (
                        <div className="col-span-full text-center py-10 text-neutral-500">
                            Tidak ada event yang tersedia.
                        </div>
                    ) : (
                        filtered.map((event) => (
                            <Card key={event.id} className="overflow-hidden">
                                <CardContent className="pt-6 pb-4">
                                    <div className="flex flex-col gap-2">
                                        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                            {event.category?.name ?? "Umum"}
                                        </span>
                                        <h3 className="text-lg font-semibold">
                                            {event.title}
                                        </h3>
                                        <p className="text-sm text-neutral-600 line-clamp-2">
                                            {event.description}
                                        </p>
                                        <div className="mt-3 flex items-center gap-1 text-sm">
                                            <span className="text-neutral-500">
                                                Tanggal
                                            </span>
                                            <span>{event.event_date}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-sm mt-1">
                                            <span className="text-neutral-500">
                                                Kuota
                                            </span>
                                            <span
                                                className={
                                                    remaining(event) === 0
                                                        ? "text-error font-bold"
                                                        : "text-success font-bold"
                                                }
                                            >
                                                {remaining(event)} tersisa /{" "}
                                                {event.quota}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex items-center space-x-2">
                                    <Button
                                        onClick={() =>
                                            void handleRegister(event.id)
                                        }
                                        disabled={remaining(event) === 0}
                                        className="flex-1"
                                    >
                                        {remaining(event) === 0
                                            ? "Kuota Penuh"
                                            : "Daftar"}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
