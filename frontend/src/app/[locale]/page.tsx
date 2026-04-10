import { setRequestLocale } from 'next-intl/server';
import { Header, Footer } from '@/components/layout';
import { Hero, Services, Treatments, Pricing, TrustBar, Testimonials, FAQ, Appointment, Contact } from '@/components/sections';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Services />
        <Treatments />
        <Pricing />
        <TrustBar />
        <Testimonials />
        <FAQ />
        <Appointment />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
