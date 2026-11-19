import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { apiJson } from '@/lib/api';
import { toast } from 'sonner';

type Props = {
    status?: string;
};

export default function Login({ status }: Props) {
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setProcessing(true);

        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            await apiJson('/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            router.visit('/dashboard');
        } catch (err: unknown) {
            const errorObj = err as Error & { status?: number; message?: string };
            setError(
                errorObj.status === 401
                    ? 'Email atau password salah'
                    : errorObj?.message ?? 'Login gagal',
            );
            toast.error(errorObj?.message ?? 'Login gagal');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <>
            <Head title="Login" />
            <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
                <Card className="w-full max-w-md shadow-xl">
                    <CardHeader className="text-center">
                        <CardTitle className="text-xl">Masuk ke Akun</CardTitle>
                        <CardDescription>
                            Silakan login untuk mengakses sistem manajemen event.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {status && (
                            <div className="text-center text-sm text-green-600">{status}</div>
                        )}
                        {error && (
                            <div className="text-center text-sm text-destructive">{error}</div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    placeholder="nama@contoh.com"
                                    autoComplete="email"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Kata Sandi</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    required
                                    autoComplete="current-password"
                                />
                            </div>
                            <Button type="submit" disabled={processing} className="w-full">
                                {processing ? 'Memproses...' : 'Masuk'}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex items-center justify-center text-center gap-1">
                        <span className="text-sm text-neutral-500">
                            Selamat datang kembali
                        </span>
                    </CardFooter>
                </Card>
            </div>
        </>
    );
}

Login.layout = {
    title: 'Login',
};
