import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { apiJson } from '@/lib/api';
import { toast } from 'sonner';

type Category = { id: number; name: string };

type EventData = {
    id: number;
    title: string;
    description: string;
    category_id: number;
    event_date: string;
    quota: number;
    category?: Category | null;
};

type FormValues = {
    title: string;
    description: string;
    category_id: string;
    event_date: string;
    quota: string;
};

function isCategory(value: unknown): value is Category {
    return (
        typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        'name' in value
    );
}

export default function EventForm() {
    const isEdit = window.location.pathname.includes('/edit');
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [form, setForm] = useState<FormValues>({
        title: '',
        description: '',
        category_id: '',
        event_date: '',
        quota: '',
    });

    useEffect(() => {
        (async () => {
            try {
                const data = await apiJson<{ data: unknown[] }>('/api/categories');
                setCategories(data.data.filter(isCategory));
            } catch (err) {
                toast.error('Gagal memuat kategori');
            }
        })();

        const match = window.location.pathname.match(/\/events\/(\d+)\/edit/);
        if (match) {
            (async () => {
                try {
                    const data = await apiJson<{ data: EventData }>(
                        `/api/events/${match[1]}`,
                    );
                    setForm({
                        title: data.data.title,
                        description: data.data.description,
                        category_id: String(data.data.category_id),
                        event_date: data.data.event_date,
                        quota: String(data.data.quota),
                    });
                } catch (err) {
                    toast.error('Gagal memuat data event');
                }
            })();
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            title: form.title,
            description: form.description,
            category_id: Number(form.category_id),
            event_date: form.event_date,
            quota: Number(form.quota),
        };

        try {
            if (isEdit) {
                const match = window.location.pathname.match(/\/events\/(\d+)\/edit/);
                if (match) {
                    await apiJson(`/api/events/${match[1]}`, {
                        method: 'PUT',
                        body: JSON.stringify(payload),
                    });
                    toast.success('Event berhasil diperbarui');
                }
            } else {
                await apiJson('/api/events', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
                toast.success('Event berhasil ditambahkan');
            }
            router.visit('/dashboard');
        } catch (err: any) {
            toast.error(err?.message ?? 'Gagal menyimpan event');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head title={isEdit ? 'Edit Event' : 'Tambah Event'} />
            <div className="max-w-2xl mx-auto py-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{isEdit ? 'Edit Event' : 'Tambah Event Baru'}</CardTitle>
                        <CardDescription>
                            Isi formulir berikut untuk menyimpan data event.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Judul Event</Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        required
                                        placeholder="Contoh: Seminar Web Technology"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category_id">Kategori</Label>
                                    <Select
                                        value={form.category_id}
                                        onValueChange={(v) => setForm({ ...form, category_id: v })}
                                    >
                                        <SelectTrigger id="category_id">
                                            <SelectValue placeholder="Pilih kategori" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((c) => (
                                                <SelectItem key={c.id} value={c.id.toString()}>
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Deskripsi</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    required
                                    rows={4}
                                    placeholder="Deskripsi singkat tentang event ini"
                                />
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="event_date">Tanggal Event</Label>
                                    <Input
                                        id="event_date"
                                        name="event_date"
                                        type="date"
                                        value={form.event_date}
                                        onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="quota">Kuota Peserta</Label>
                                    <Input
                                        id="quota"
                                        name="quota"
                                        type="number"
                                        min="1"
                                        value={form.quota}
                                        onChange={(e) => setForm({ ...form, quota: e.target.value })}
                                        required
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button type="submit" disabled={loading} className="flex-1">
                                    {loading ? 'Menyimpan...' : isEdit ? 'Perbarui Event' : 'Simpan Event'}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => router.visit('/dashboard')}
                                    variant="outline"
                                >
                                    Batal
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
