import "dotenv/config";
import { PrismaClient, type EventStatus, type EventVisibility, type TicketTypeStatus, type UserRole } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

const DEMO_AUTH_USER_ID = "11111111-1111-1111-1111-111111111111";

type SeedTicketType = {
  name: string;
  price: number;
  inventory: number;
};

type SeedEvent = {
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  startsAt: Date;
  endsAt: Date;
  city: string;
  region: string;
  country: string;
  venueName: string;
  category: string;
  imageUrl: string;
  galleryUrls?: string[];
  tagline?: string;
  heroSubtitle?: string;
  presenterLine?: string;
  ticketNote?: string;
  ticketPrice: number;
  featured: boolean;
  ticketTypes: SeedTicketType[];
};

const eventSeeds: SeedEvent[] = [
  {
    title: "Indie Night at The Loft",
    slug: "indie-night-at-the-loft",
    description:
      "Local bands, vinyl DJs, and a late-night snack bar. Doors at 7pm. All ages welcome in the cafe until 9pm.",
    shortDescription: "Local bands, vinyl DJs, and a late-night snack bar.",
    startsAt: new Date(Date.now() + 86400000 * 3 + 19 * 3600000),
    endsAt: new Date(Date.now() + 86400000 * 3 + 23 * 3600000),
    city: "Austin",
    region: "TX",
    country: "USA",
    venueName: "The Loft",
    category: "Music",
    imageUrl:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80",
    galleryUrls: [
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80",
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80",
    ],
    tagline: "Your night out starts here.",
    heroSubtitle: "LIVE MUSIC — AUSTIN TX",
    presenterLine: "Live Nation Austin presents",
    ticketNote: "Mobile entry. Have your QR ready at the door.",
    ticketPrice: 29,
    featured: true,
    ticketTypes: [
      { name: "General admission", price: 29, inventory: 180 },
      { name: "VIP balcony", price: 79, inventory: 40 },
    ],
  },
  {
    title: "Morning Yoga in the Park",
    slug: "morning-yoga-in-the-park",
    description:
      "Bring a mat and water. Guided flow for all levels, led by certified instructors. Rain date posted on our site.",
    shortDescription: "Outdoor guided flow for all levels.",
    startsAt: new Date(Date.now() + 86400000 * 2 + 8 * 3600000),
    endsAt: new Date(Date.now() + 86400000 * 2 + 9 * 3600000),
    city: "Denver",
    region: "CO",
    country: "USA",
    venueName: "Civic Green",
    category: "Wellness",
    imageUrl:
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80",
    ticketNote: "BYO mat. Arrive 15 minutes early.",
    ticketPrice: 0,
    featured: true,
    ticketTypes: [{ name: "General admission", price: 0, inventory: 100 }],
  },
  {
    title: "Design Systems Workshop",
    slug: "design-systems-workshop",
    description:
      "Hands-on session on tokens, components, and documentation. Laptop required. Lunch included.",
    shortDescription: "Hands-on design systems deep dive.",
    startsAt: new Date(Date.now() + 86400000 * 10 + 10 * 3600000),
    endsAt: new Date(Date.now() + 86400000 * 10 + 16 * 3600000),
    city: "San Francisco",
    region: "CA",
    country: "USA",
    venueName: "Pier 39 Labs",
    category: "Classes",
    imageUrl:
      "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&q=80",
    ticketPrice: 149,
    featured: true,
    ticketTypes: [
      { name: "Workshop pass", price: 149, inventory: 80 },
      { name: "Team bundle", price: 499, inventory: 15 },
    ],
  },
];

async function upsertCategory(name: string) {
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  return prisma.category.upsert({
    where: { slug },
    update: { name },
    create: {
      name,
      slug,
    },
  });
}

async function main() {
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@evently.dev" },
    update: {
      authUserId: DEMO_AUTH_USER_ID,
      name: "Demo User",
      role: "ORGANIZER" satisfies UserRole,
    },
    create: {
      authUserId: DEMO_AUTH_USER_ID,
      email: "demo@evently.dev",
      name: "Demo User",
      role: "ORGANIZER" satisfies UserRole,
    },
  });

  await prisma.organizer.upsert({
    where: { id: demoUser.id },
    update: {
      handle: "evently-demo",
      name: "Evently Demo",
      contactEmail: "demo@evently.dev",
      bio: "Demo organizer profile for Evently sample content.",
      verified: true,
    },
    create: {
      id: demoUser.id,
      handle: "evently-demo",
      name: "Evently Demo",
      contactEmail: "demo@evently.dev",
      bio: "Demo organizer profile for Evently sample content.",
      verified: true,
    },
  });

  for (const seed of eventSeeds) {
    const category = await upsertCategory(seed.category);
    const venue = await prisma.venue.upsert({
      where: {
        id: `seed-${seed.slug}`,
      },
      update: {
        name: seed.venueName,
        addressLine1: seed.venueName,
        city: seed.city,
        state: seed.region,
        country: seed.country,
      },
      create: {
        id: `seed-${seed.slug}`,
        name: seed.venueName,
        addressLine1: seed.venueName,
        city: seed.city,
        state: seed.region,
        country: seed.country,
      },
    });

    const event = await prisma.event.upsert({
      where: { slug: seed.slug },
      update: {
        organizerId: demoUser.id,
        venueId: venue.id,
        categoryId: category.id,
        title: seed.title,
        subtitle: null,
        shortDescription: seed.shortDescription,
        description: seed.description,
        category: seed.category,
        city: seed.city,
        region: seed.region,
        country: seed.country,
        venueName: seed.venueName,
        imageUrl: seed.imageUrl,
        galleryUrls: seed.galleryUrls,
        tagline: seed.tagline ?? null,
        heroSubtitle: seed.heroSubtitle ?? null,
        presenterLine: seed.presenterLine ?? null,
        organizerLogoUrl: null,
        ticketPrice: seed.ticketPrice,
        ticketCurrency: "USD",
        salesEndsAt: seed.startsAt,
        capacity: seed.ticketTypes.reduce((sum, ticketType) => sum + ticketType.inventory, 0),
        ticketNote: seed.ticketNote ?? null,
        status: "PUBLISHED" satisfies EventStatus,
        visibility: "PUBLIC" satisfies EventVisibility,
        featured: seed.featured,
        startsAt: seed.startsAt,
        endsAt: seed.endsAt,
        timezone: "America/New_York",
        refundPolicy: "Tickets are refundable up to 24 hours before the event.",
        published: true,
        publishedAt: new Date(),
      },
      create: {
        organizerId: demoUser.id,
        venueId: venue.id,
        categoryId: category.id,
        slug: seed.slug,
        title: seed.title,
        subtitle: null,
        shortDescription: seed.shortDescription,
        description: seed.description,
        category: seed.category,
        city: seed.city,
        region: seed.region,
        country: seed.country,
        venueName: seed.venueName,
        imageUrl: seed.imageUrl,
        galleryUrls: seed.galleryUrls,
        tagline: seed.tagline ?? null,
        heroSubtitle: seed.heroSubtitle ?? null,
        presenterLine: seed.presenterLine ?? null,
        organizerLogoUrl: null,
        ticketPrice: seed.ticketPrice,
        ticketCurrency: "USD",
        salesEndsAt: seed.startsAt,
        capacity: seed.ticketTypes.reduce((sum, ticketType) => sum + ticketType.inventory, 0),
        ticketNote: seed.ticketNote ?? null,
        status: "PUBLISHED" satisfies EventStatus,
        visibility: "PUBLIC" satisfies EventVisibility,
        featured: seed.featured,
        startsAt: seed.startsAt,
        endsAt: seed.endsAt,
        timezone: "America/New_York",
        refundPolicy: "Tickets are refundable up to 24 hours before the event.",
        published: true,
        publishedAt: new Date(),
      },
    });

    await prisma.ticketType.deleteMany({
      where: { eventId: event.id },
    });

    for (const [index, ticketType] of seed.ticketTypes.entries()) {
      await prisma.ticketType.create({
        data: {
          eventId: event.id,
          name: ticketType.name,
          description: ticketType.name,
          price: ticketType.price,
          currency: "USD",
          inventoryTotal: ticketType.inventory,
          inventoryRemaining: ticketType.inventory,
          minPerOrder: 1,
          maxPerOrder: Math.min(10, ticketType.inventory),
          status: "ACTIVE" satisfies TicketTypeStatus,
          sortOrder: index,
        },
      });
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
