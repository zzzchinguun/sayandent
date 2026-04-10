import 'dotenv/config';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ── Admin User ──
    const email = process.env.ADMIN_SEED_EMAIL || 'admin@sayandent.mn';
    const password = process.env.ADMIN_SEED_PASSWORD || 'admin123';
    const passwordHash = await bcrypt.hash(password, 12);

    await client.query(
      `INSERT INTO admin_users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      [email, passwordHash, 'Admin', 'superadmin']
    );
    console.log(`Admin user: ${email}`);

    // ── FAQs ──
    const faqs = [
      {
        mn: { question: 'Шүдний имплант тавиулахад өвддөг үү?', answer: 'Орчин үеийн шүдний имплантын мэс ажилбар нь мэдээ алдуулалт хийгддэг тул бараг өвдөлтгүй. Ихэнх өвчтнүүд шүд авхуулахаас бага зовиуртай гэж хэлдэг.' },
        en: { question: 'Does it hurt to get a dental implant?', answer: 'Modern dental implant procedures are performed under local anesthesia and are virtually painless. Most patients report less discomfort than a tooth extraction.' },
      },
      {
        mn: { question: 'Хэр олон удаа шүдний эмчид үзүүлэх ёстой вэ?', answer: 'Бид 6 сар тутамд тогтмол үзлэг хийлгэхийг зөвлөдөг. Гэхдээ тусгай нөхцөлтэй бол эмч илүү олон удаа ирэхийг зөвлөж болно.' },
        en: { question: 'How often should I visit the dentist?', answer: 'We recommend visiting every 6 months for a routine check-up and professional cleaning. However, your dentist may recommend more frequent visits for specific conditions.' },
      },
      {
        mn: { question: 'Шүдний даатгал хүлээн авдаг уу?', answer: 'Тийм, бид ихэнх томоохон шүдний даатгалын байгууллагуудтай хамтран ажилладаг. Мөн уян хатан төлбөрийн нөхцөл санал болгодог.' },
        en: { question: 'Do you accept dental insurance?', answer: 'Yes, we work with most major dental insurance providers. We also offer flexible payment plans.' },
      },
      {
        mn: { question: 'Шүд цайруулга хэр удаан үргэлжилдэг вэ?', answer: 'Мэргэжлийн шүд цайруулгын үр дүн хоол хүнс, амны ариун цэвэр, амьдралын хэв маягаас хамааран 1-3 жил үргэлжилдэг.' },
        en: { question: 'How long does teeth whitening last?', answer: 'Professional teeth whitening results typically last 1-3 years depending on your diet, oral hygiene habits, and lifestyle factors.' },
      },
      {
        mn: { question: 'Хүүхдүүд хэдэн наснаас шүдний эмчид үзүүлэх ёстой вэ?', answer: 'Бид хүүхдийнхээ анхны шүд ургасны дараа 6 сарын дотор эсвэл 1 настайдаа анхны үзлэгт авчрахыг зөвлөдөг.' },
        en: { question: 'What age should children first visit the dentist?', answer: 'We recommend bringing your child for their first dental visit by age 1 or within 6 months of their first tooth appearing.' },
      },
      {
        mn: { question: 'Брэкет эсвэл ил харагдахгүй жигдрүүлэгч аль нь дээр вэ?', answer: 'Хоёулаа үр дүнтэй. Ил харагдахгүй жигдрүүлэгч бага зэргийн тохиолдолд тохиромжтой. Уламжлалт брэкет нь нарийн төвөгтэй тэгшлэлтэд илүү тохиромжтой.' },
        en: { question: 'Are braces or clear aligners better?', answer: 'Both options are effective. Clear aligners are ideal for mild to moderate cases. Traditional braces are better for complex alignment issues.' },
      },
    ];

    for (let i = 0; i < faqs.length; i++) {
      const faq = faqs[i];
      const result = await client.query(
        'INSERT INTO faqs (sort_order, is_active) VALUES ($1, true) RETURNING id',
        [i]
      );
      const faqId = result.rows[0].id;
      await client.query(
        'INSERT INTO faq_translations (faq_id, locale, question, answer) VALUES ($1, $2, $3, $4)',
        [faqId, 'mn', faq.mn.question, faq.mn.answer]
      );
      await client.query(
        'INSERT INTO faq_translations (faq_id, locale, question, answer) VALUES ($1, $2, $3, $4)',
        [faqId, 'en', faq.en.question, faq.en.answer]
      );
    }
    console.log(`Seeded ${faqs.length} FAQs`);

    // ── Testimonials ──
    const testimonials = [
      {
        mn: { name: 'Бат-Эрдэнэ Д.', role: 'Өвчтөн', content: 'Маш сайн үйлчилгээ. Эмч нар маш эелдэг, мэргэжлийн түвшинд үзлэг хийсэн.', avatar: 'БД' },
        en: { name: 'Bat-Erdene D.', role: 'Patient', content: 'Excellent service. The doctors were very friendly and professional during the examination.', avatar: 'BD' },
      },
      {
        mn: { name: 'Сарангэрэл Т.', role: 'Өвчтөн', content: 'Шүдний имплант маш амжилттай хийгдсэн. Одоо ямар ч асуудалгүй.', avatar: 'СТ' },
        en: { name: 'Sarangerel T.', role: 'Patient', content: 'The dental implant was done very successfully. No problems at all now.', avatar: 'ST' },
      },
      {
        mn: { name: 'Ганбаатар Б.', role: 'Өвчтөн', content: 'Хүүхдүүдэд маш сайн хандаж, тэвчээртэй тайлбарлаж өгсөн. Баярлалаа!', avatar: 'ГБ' },
        en: { name: 'Ganbaatar B.', role: 'Patient', content: 'Great with children - they explained everything patiently. Thank you!', avatar: 'GB' },
      },
      {
        mn: { name: 'Оюунчимэг Э.', role: 'Өвчтөн', content: 'Шүд цайруулга хийлгэсэн. Үр дүн маш гоё, өнгө нь тод цагаан болсон.', avatar: 'ОЭ' },
        en: { name: 'Oyuunchimeg E.', role: 'Patient', content: 'Had teeth whitening done. The results are amazing, my teeth are bright white now.', avatar: 'OE' },
      },
      {
        mn: { name: 'Тэмүүлэн С.', role: 'Өвчтөн', content: 'Яаралтай тусламж авсан. Шөнийн цагаар ч гэсэн хурдан хариу өгсөн.', avatar: 'ТС' },
        en: { name: 'Temuulen S.', role: 'Patient', content: 'Received emergency care. They responded quickly even during nighttime hours.', avatar: 'TS' },
      },
      {
        mn: { name: 'Нарангэрэл М.', role: 'Өвчтөн', content: 'Ортодонтын эмчилгээ маш сайн явагдаж байна. 6 сарын дотор ихээхэн өөрчлөлт гарсан.', avatar: 'НМ' },
        en: { name: 'Narangerel M.', role: 'Patient', content: 'Orthodontic treatment is going very well. Significant improvement in just 6 months.', avatar: 'NM' },
      },
    ];

    for (let i = 0; i < testimonials.length; i++) {
      const t = testimonials[i];
      const result = await client.query(
        'INSERT INTO testimonials (sort_order, is_active) VALUES ($1, true) RETURNING id',
        [i]
      );
      const tId = result.rows[0].id;
      await client.query(
        'INSERT INTO testimonial_translations (testimonial_id, locale, name, role, content, avatar) VALUES ($1, $2, $3, $4, $5, $6)',
        [tId, 'mn', t.mn.name, t.mn.role, t.mn.content, t.mn.avatar]
      );
      await client.query(
        'INSERT INTO testimonial_translations (testimonial_id, locale, name, role, content, avatar) VALUES ($1, $2, $3, $4, $5, $6)',
        [tId, 'en', t.en.name, t.en.role, t.en.content, t.en.avatar]
      );
    }
    console.log(`Seeded ${testimonials.length} testimonials`);

    // ── Services ──
    const services = [
      { slug: 'cleaning', mn: { title: 'Шүд цэвэрлэгээ', description: 'Мэргэжлийн шүдний цэвэрлэгээ, чулуу авах' }, en: { title: 'Teeth Cleaning', description: 'Professional dental cleaning and tartar removal' } },
      { slug: 'fillings', mn: { title: 'Ломбо тавих', description: 'Шүдний ломбо тавих, сэргээн засах' }, en: { title: 'Fillings', description: 'Dental fillings and restoration' } },
      { slug: 'whitening', mn: { title: 'Шүд цайруулга', description: 'Мэргэжлийн шүд цайруулах үйлчилгээ' }, en: { title: 'Teeth Whitening', description: 'Professional teeth whitening service' } },
      { slug: 'implants', mn: { title: 'Имплант', description: 'Шүдний имплант суулгах' }, en: { title: 'Dental Implants', description: 'Dental implant placement' } },
      { slug: 'orthodontics', mn: { title: 'Ортодонт', description: 'Брэкет, жигдрүүлэгч тавих' }, en: { title: 'Orthodontics', description: 'Braces and aligners' } },
      { slug: 'root-canal', mn: { title: 'Суваг эмчилгээ', description: 'Шүдний суваг эмчилгээ' }, en: { title: 'Root Canal', description: 'Root canal treatment' } },
      { slug: 'crowns', mn: { title: 'Титэм', description: 'Шүдний титэм, гүүр хийх' }, en: { title: 'Crowns & Bridges', description: 'Dental crowns and bridges' } },
      { slug: 'extraction', mn: { title: 'Шүд авах', description: 'Шүд авах мэс ажилбар' }, en: { title: 'Tooth Extraction', description: 'Tooth extraction procedures' } },
      { slug: 'pediatric', mn: { title: 'Хүүхдийн шүдний эмчилгээ', description: 'Хүүхдэд зориулсан шүдний тусгай эмчилгээ' }, en: { title: 'Pediatric Dentistry', description: 'Specialized dental care for children' } },
    ];

    for (let i = 0; i < services.length; i++) {
      const s = services[i];
      const result = await client.query(
        'INSERT INTO services (slug, sort_order, is_active) VALUES ($1, $2, true) RETURNING id',
        [s.slug, i]
      );
      const sId = result.rows[0].id;
      await client.query(
        'INSERT INTO service_translations (service_id, locale, title, description) VALUES ($1, $2, $3, $4)',
        [sId, 'mn', s.mn.title, s.mn.description]
      );
      await client.query(
        'INSERT INTO service_translations (service_id, locale, title, description) VALUES ($1, $2, $3, $4)',
        [sId, 'en', s.en.title, s.en.description]
      );
    }
    console.log(`Seeded ${services.length} services`);

    // ── Staff ──
    const staffMembers = [
      { slug: 'dr-sonin-batsanaa', mn: { name: 'Сонин Батсанаа', title: 'Нүүр амны мэс заслын их эмч, Согог заслын их эмч', bio: 'Нүүр амны мэс засал болон согог заслын мэргэжилтэн' }, en: { name: 'Sonin Batsanaa', title: 'Oral Surgeon & Orthodontist', bio: 'Specialist in oral surgery and orthodontics' } },
      { slug: 'dr-onon-erdenebat', mn: { name: 'Онон Эрдэнэбат', title: 'Нүүр амны их эмч', bio: 'Нүүр амны эрүүл мэндийн мэргэжилтэн' }, en: { name: 'Onon Erdenebat', title: 'General Dentist', bio: 'General dentistry specialist' } },
      { slug: 'dr-ganbaatar-erdenezorig', mn: { name: 'Ганбаатар Эрдэнэзориг', title: 'Нүүр амны их эмч', bio: 'Нүүр амны эрүүл мэндийн мэргэжилтэн' }, en: { name: 'Ganbaatar Erdenezorig', title: 'General Dentist', bio: 'General dentistry specialist' } },
      { slug: 'dr-ganbayar-khongorzul', mn: { name: 'Ганбаяр Хонгорзул', title: 'Нүүр амны их эмч', bio: 'Нүүр амны эрүүл мэндийн мэргэжилтэн' }, en: { name: 'Ganbayar Khongorzul', title: 'General Dentist', bio: 'General dentistry specialist' } },
      { slug: 'dr-ganbold-tsenguun', mn: { name: 'Ганболд Цэнгүүн', title: 'Нүүр амны их эмч', bio: 'Нүүр амны эрүүл мэндийн мэргэжилтэн' }, en: { name: 'Ganbold Tsenguun', title: 'General Dentist', bio: 'General dentistry specialist' } },
    ];

    for (let i = 0; i < staffMembers.length; i++) {
      const s = staffMembers[i];
      const result = await client.query(
        'INSERT INTO staff (slug, sort_order, is_active) VALUES ($1, $2, true) RETURNING id',
        [s.slug, i]
      );
      const sId = result.rows[0].id;
      await client.query(
        'INSERT INTO staff_translations (staff_id, locale, name, title, bio) VALUES ($1, $2, $3, $4, $5)',
        [sId, 'mn', s.mn.name, s.mn.title, s.mn.bio]
      );
      await client.query(
        'INSERT INTO staff_translations (staff_id, locale, name, title, bio) VALUES ($1, $2, $3, $4, $5)',
        [sId, 'en', s.en.name, s.en.title, s.en.bio]
      );
    }
    console.log(`Seeded ${staffMembers.length} staff members`);

    await client.query('COMMIT');
    console.log('Seed completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
