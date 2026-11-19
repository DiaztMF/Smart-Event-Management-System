import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { apiJson } from '@/lib/api';
import { toast } from 'sonner';

type Registration = {
    id: number;
    status: string;
    created_at: string;
    event: {
        id: number;
        title: string;
        event_date: string;
        category?: { name: string } | null;
    };
};

function isRegistration(value: unknown): value is Registration {
    return (
        typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        'status' in value &&
        'event' in value
    );
}

function statusBadge(status: string) {
    const variants: Record<string, string> = {
        registered: 'bg-blue-100 text-blue-700',
        attended: 'bg-green-100 text-green-700',
        canceled: 'bg-neutral-100 text-neutral-700',
    };
    return <Badge className={variants[status] ?? 'bg-neutral-100'}>{status}</Badge>;
}

export default function Registrations() {
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchRegistrations = async () => {
        setLoading(true);
        try {
            const data = await apiJson<{ data: unknown[] }>('/api/my-registrations');
            setRegistrations(data.data.filter(isRegistration));
        } catch (err: any) {
            toast.error(err?.message ?? 'Gagal memuat riwayat pendaftaran');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id: number) => {
        if (!window.confirm('Yakin ingin membatalkan pendaftaran ini?')) return;
        setLoading(true);
        try {
            await apiJson(`/api/registrations/${id}/cancel`, { method: 'PUT' });
            toast.success('Pendaftaran berhasil dibatalkan');
            await fetchRegistrations();
        } catch (err: any) {
            toast.error(err?.message ?? 'Gagal membatalkan pendaftaran');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchRegistrations();
    }, []);

    return (
        <>
            <Head title="Riwayat Pendaftaran" />
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Riwayat Pendaftaran</CardTitle>
                            <CardDescription>
                                Daftar event yang telah Anda daftarkan.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {registrations.length === 0 ? (
                        <div className="col-span-full text-center py-10 text-neutral-500">
                            Anda belum memiliki pendaftaran event.
                        </div>
                    ) : (
                        registrations.map((reg) => (
                            <Card key={reg.id} className="overflow-hidden">
                                <CardContent className="pt-6 pb-4">
                                    <div className="flex flex-col gap-2">
                                        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                            {reg.event.category?.name ?? 'Umum'}
                                        </span>
                                        <h3 className="text-lg font-semibold">{reg.event.title}</h3>
                                        <div className="mt-3 flex items-center gap-1 text-sm">
                                            <span className="text-neutral-500">Tanggal</span>
                                            <span>{reg.event.event_date}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-sm mt-1">
                                            <span className="text-neutral-500">Status</span>
                                            {statusBadge(reg.status)}
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex items-center space-x-2">
                                    {reg.status === 'registered' && (
                                        <Button
                                            onClick={() => void handleCancel(reg.id)}
                                            disabled={loading}
                                            variant="outline"
                                            className="flex-1"
                                        >
                                            Batalkan
                                        </Button>
                                    )}
                                    {reg.status !== 'registered' && (
                                        <Button variant="outline" className="flex-1" disabled>
                                            {reg.status}
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
