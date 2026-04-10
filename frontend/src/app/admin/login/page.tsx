'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Нэвтрэхэд алдаа гарлаа');
        return;
      }

      router.push('/admin');
    } catch {
      setError('Сүлжээний алдаа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-earth-50 lg:grid lg:grid-cols-2">
      {/* LEFT — branded panel. Plum gradient with the editorial dividers
          mirroring the Hero section so admin login feels like part of the
          same site, not a generic dashboard skin. */}
      <aside className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-linear-to-br from-primary-700 via-primary-800 to-primary-950 text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-24 w-96 h-96 rounded-full bg-accent-400/10 blur-3xl" />
          <div className="absolute bottom-1/4 -right-24 w-96 h-96 rounded-full bg-primary-400/15 blur-3xl" />
          <div className="absolute top-0 bottom-0 left-2/3 w-px bg-white/10" />
          <div className="absolute left-0 right-0 bottom-20 h-px bg-white/10" />
        </div>

        <div className="relative">
          <Image
            src="/images/logo/logo-light.png"
            alt="Sayan Dent"
            width={180}
            height={180}
            className="object-contain"
            priority
          />
        </div>

        <div className="relative space-y-6">
          <h2
            className="text-5xl xl:text-6xl font-medium leading-[0.95]"
            style={{ fontFamily: 'var(--font-exo2)' }}
          >
            <span className="block text-white">Удирдлагын</span>
            <span className="block text-accent-300">самбар</span>
          </h2>
          <p className="text-white/70 max-w-sm leading-relaxed">
            Цаг авах хүсэлт, өвчтөний мэдээлэл, контентын удирдлага — бүгд нэг дороос.
          </p>
        </div>

        <p className="relative text-xs text-white/40 tracking-wide">
          © {new Date().getFullYear()} Sayan Dent
        </p>
      </aside>

      {/* RIGHT — form panel. Cream background, warm cards, plum CTA. */}
      <main className="flex items-center justify-center px-6 py-16 lg:px-16">
        <div className="w-full max-w-md">
          {/* Mobile-only logo (left panel is hidden < lg) */}
          <div className="lg:hidden mb-10 flex justify-center">
            <Image
              src="/images/logo/logo-dark.png"
              alt="Sayan Dent"
              width={160}
              height={160}
              className="object-contain"
              priority
            />
          </div>

          <div className="space-y-2 mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-600">
              Admin Portal
            </p>
            <h1
              className="text-4xl font-medium text-primary-900 leading-tight"
              style={{ fontFamily: 'var(--font-exo2)' }}
            >
              Тавтай морил
            </h1>
            <p className="text-earth-600">
              Бүртгэлтэй хаягаараа нэвтэрнэ үү.
            </p>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-primary-900">
                Имэйл хаяг
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-earth-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white border border-earth-200 text-primary-900 placeholder-earth-400 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
                  placeholder="example@sayandent.mn"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-primary-900">
                Нууц үг
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-earth-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-white border border-earth-200 text-primary-900 placeholder-earth-400 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-earth-400 hover:text-primary-700 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-lg shadow-primary-600/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Нэвтэрж байна...
                </>
              ) : (
                <>
                  Нэвтрэх
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
