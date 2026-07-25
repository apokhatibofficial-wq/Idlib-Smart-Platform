import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Idlib@2026';

async function upsertUser(params: {
  email: string;
  username: string;
  fullName: string;
  role: 'CITIZEN' | 'MERCHANT' | 'ADMIN';
  phone?: string;
}) {
  const passwordHash = await argon2.hash(DEMO_PASSWORD, { type: argon2.argon2id });
  return prisma.user.upsert({
    where: { email: params.email },
    update: {},
    create: {
      email: params.email,
      username: params.username,
      fullName: params.fullName,
      role: params.role,
      phone: params.phone,
      passwordHash,
      emailVerifiedAt: new Date(),
    },
  });
}

async function main() {
  console.log('🌱 Seeding منصة إدلب الذكية...');

  const admin = await upsertUser({
    email: 'admintest1@test.com',
    username: 'admin',
    fullName: 'سامر إدلبي',
    role: 'ADMIN',
  });

  const citizen = await upsertUser({
    email: 'admintest2@test.com',
    username: 'ahmad.idlib',
    fullName: 'أحمد الحلبي',
    role: 'CITIZEN',
    phone: '+963900000001',
  });

  // ---------------------------------------------------------------------
  // Merchants + stores + products
  // ---------------------------------------------------------------------
  const storeSeeds = [
    {
      email: 'admintest3@test.com',
      username: 'restaurant.shaam',
      owner: 'مالك مطعم بيت الشام',
      name: 'مطعم بيت الشام',
      category: 'FOOD' as const,
      rating: 4.8,
      delivery: true,
      products: [
        { name: 'مندي لحم', price: '35000' },
        { name: 'شاورما دجاج', price: '12000' },
        { name: 'حمص بطحينة', price: '6000' },
      ],
    },
    {
      email: 'admintest4@test.com',
      username: 'fashion.reem',
      owner: 'ريم — أزياء ريم',
      name: 'أزياء ريم',
      category: 'CLOTHES' as const,
      rating: 4.5,
      delivery: false,
      products: [
        { name: 'عباية سوداء', price: '80000' },
        { name: 'حجاب حرير', price: '15000' },
      ],
    },
    {
      email: 'admintest5@test.com',
      username: 'electronics.alnoor',
      owner: 'مالك إلكترونيات النور',
      name: 'إلكترونيات النور',
      category: 'ELECTRONICS' as const,
      rating: 4.6,
      delivery: true,
      products: [
        { name: 'سماعة بلوتوث', price: '90000' },
        { name: 'شاحن سريع', price: '25000' },
      ],
    },
    {
      email: 'admintest6@test.com',
      username: 'pharmacy.shifa',
      owner: 'صيدلانية صيدلية الشفاء',
      name: 'صيدلية الشفاء',
      category: 'HEALTH' as const,
      rating: 4.9,
      delivery: true,
      products: [
        { name: 'باراسيتامول', price: '4000' },
        { name: 'فيتامين سي', price: '18000' },
      ],
    },
  ];

  const stores: Record<string, Awaited<ReturnType<typeof prisma.store.create>>> = {};
  for (const s of storeSeeds) {
    const owner = await upsertUser({
      email: s.email,
      username: s.username,
      fullName: s.owner,
      role: 'MERCHANT',
    });
    const store = await prisma.store.upsert({
      where: { ownerId: owner.id },
      update: {},
      create: {
        ownerId: owner.id,
        name: s.name,
        category: s.category,
        description: `${s.name} — خدمة موثوقة في محافظة إدلب`,
        ratingAvg: s.rating,
        ratingCount: 24,
        deliveryAvailable: s.delivery,
        products: { create: s.products.map((p) => ({ name: p.name, price: p.price })) },
      },
    });
    stores[s.name] = store;
  }

  // ---------------------------------------------------------------------
  // News + alerts
  // ---------------------------------------------------------------------
  await prisma.newsItem.createMany({
    data: [
      {
        title: 'افتتاح جسر جديد يربط بين حي الزراعة وحي القصور',
        tag: 'أخبار عامة',
        authorId: admin.id,
      },
      { title: 'حملة تعقيم شاملة في الأسواق الشعبية هذا الأسبوع', tag: 'صحة', authorId: admin.id },
      { title: 'جدول مواعيد صرف المساعدات الشهرية لشهر آب', tag: 'إعلان رسمي', authorId: admin.id },
    ],
    skipDuplicates: true,
  });

  await prisma.alert.createMany({
    data: [
      { text: 'انقطاع مؤقت للكهرباء في حي الزراعة غدًا من 9 إلى 1 ظهرًا' },
      { text: 'إغلاق طريق الساحة الرئيسية مؤقتًا بسبب أعمال الصيانة' },
    ],
    skipDuplicates: true,
  });

  // ---------------------------------------------------------------------
  // Complaints for the demo citizen
  // ---------------------------------------------------------------------
  const complaintSeeds = [
    {
      category: 'ROADS' as const,
      status: 'RESOLVED' as const,
      description: 'حفرة كبيرة في شارع الزراعة تسبب أضرارًا للمركبات',
    },
    {
      category: 'CLEANLINESS' as const,
      status: 'IN_PROGRESS' as const,
      description: 'تراكم النفايات في حي المدينة منذ عدة أيام',
    },
    {
      category: 'PRICING' as const,
      status: 'UNDER_REVIEW' as const,
      description: 'رفع أسعار المواد الغذائية بشكل غير مبرر في سوق الهال',
    },
  ];
  for (const c of complaintSeeds) {
    const existing = await prisma.complaint.findFirst({
      where: { citizenId: citizen.id, description: c.description },
    });
    if (existing) continue;
    await prisma.complaint.create({
      data: {
        citizenId: citizen.id,
        category: c.category,
        status: c.status,
        priority: 'MEDIUM',
        description: c.description,
        locationLabel: 'حي المدينة، إدلب',
        statusEvents: { create: [{ status: c.status, changedById: admin.id }] },
        conversation: {
          create: {
            type: 'COMPLAINT_THREAD',
            participants: { create: [{ userId: citizen.id }] },
            messages: { create: [{ body: 'تم استلام بلاغكم وهو الآن قيد الدراسة.' }] },
          },
        },
      },
    });
  }

  // ---------------------------------------------------------------------
  // Coupons
  // ---------------------------------------------------------------------
  const shaam = stores['مطعم بيت الشام'];
  if (shaam) {
    await prisma.coupon.upsert({
      where: { code: 'RAMADAN20' },
      update: {},
      create: {
        storeId: shaam.id,
        code: 'RAMADAN20',
        percentOff: 20,
        status: 'PUBLISHED',
        approvedById: admin.id,
      },
    });
    await prisma.coupon.upsert({
      where: { code: 'NEWUSER10' },
      update: {},
      create: { storeId: shaam.id, code: 'NEWUSER10', percentOff: 10, status: 'PENDING_APPROVAL' },
    });
  }

  // ---------------------------------------------------------------------
  // Pending business account requests (for the admin review screen)
  // ---------------------------------------------------------------------
  const pendingBizSeeds = [
    {
      email: 'admintest7@test.com',
      username: 'khaled.naasan',
      owner: 'خالد نعسان',
      biz: 'مخبز الأمل',
      category: 'FOOD' as const,
    },
    {
      email: 'admintest8@test.com',
      username: 'rana.abdo',
      owner: 'رنا العبدو',
      biz: 'ملابس الفجر',
      category: 'CLOTHES' as const,
    },
    {
      email: 'admintest9@test.com',
      username: 'wael.darwish',
      owner: 'وائل درويش',
      biz: 'مقهى الياسمين',
      category: 'FOOD' as const,
    },
  ];
  for (const b of pendingBizSeeds) {
    const applicant = await upsertUser({
      email: b.email,
      username: b.username,
      fullName: b.owner,
      role: 'CITIZEN',
    });
    const existing = await prisma.businessAccountRequest.findFirst({
      where: { applicantId: applicant.id },
    });
    if (existing) continue;
    await prisma.businessAccountRequest.create({
      data: {
        applicantId: applicant.id,
        businessName: b.biz,
        registrationNumber: `REG-${Math.floor(Math.random() * 90000 + 10000)}`,
        phone: '+963900000000',
        category: b.category,
        description: `${b.biz} — طلب انضمام جديد إلى منصة إدلب الذكية`,
        firstProductName: 'منتج تجريبي',
        firstProductPrice: '10000',
        status: 'PENDING_APPROVAL',
      },
    });
  }

  // ---------------------------------------------------------------------
  // Direct chats (pharmacy + official directorate) for demo richness
  // ---------------------------------------------------------------------
  const pharmacyOwner = await prisma.user.findUnique({ where: { email: 'admintest6@test.com' } });
  if (pharmacyOwner) {
    const convo = await prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          { participants: { some: { userId: citizen.id } } },
          { participants: { some: { userId: pharmacyOwner.id } } },
        ],
      },
    });
    if (!convo) {
      await prisma.conversation.create({
        data: {
          type: 'DIRECT',
          title: 'صيدلية الشفاء',
          participants: { create: [{ userId: citizen.id }, { userId: pharmacyOwner.id }] },
          messages: {
            create: [
              { senderId: pharmacyOwner.id, body: 'مرحبًا، كيف يمكنني مساعدتك؟' },
              { senderId: citizen.id, body: 'هل الدواء متوفر؟' },
              { senderId: pharmacyOwner.id, body: 'الدواء متوفر الآن، تفضل بالمرور' },
            ],
          },
        },
      });
    }
  }

  console.log('✅ Seed complete.');
  console.log(`   Admin login:   admin@idlib-smart.sy / ${DEMO_PASSWORD}`);
  console.log(`   Citizen login: ahmad@mail.com / ${DEMO_PASSWORD}`);
  console.log(`   Merchant login: shifa@mail.com / ${DEMO_PASSWORD} (صيدلية الشفاء)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
