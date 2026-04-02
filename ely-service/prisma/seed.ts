import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function seed() {
  console.log('Seeding Ely database...');

  // Create a sample hotel
  const hotel = await db.hotel.upsert({
    where: { slug: 'the-grand-manila' },
    update: {},
    create: {
      name: 'The Grand Manila Hotel',
      slug: 'the-grand-manila',
      timezone: 'Asia/Manila',
      languages: ['en', 'fil'],
      chatwootAccountId: 1,
      config: {
        create: {
          aiPersonality: 'warm_professional',
          welcomeMessage: "Welcome to The Grand Manila Hotel! I'm Ely, your AI assistant. How can I help you today?",
          handoffMessage: "Let me connect you with our front desk team. They'll be with you shortly!",
          competitorBlocklist: ['Manila Hotel', 'Sofitel Manila', 'Peninsula Manila'],
          activePromotions: [
            {
              name: 'Summer Escape',
              description: '20% off on Deluxe rooms for stays between April-June 2026',
              code: 'SUMMER2026',
              validUntil: '2026-06-30',
            },
          ],
        },
      },
    },
  });

  console.log(`Created hotel: ${hotel.name} (${hotel.id})`);

  // Seed knowledge base entries
  const entries = [
    // Property Info
    {
      category: 'property_info' as const,
      question: 'What is The Grand Manila Hotel?',
      answer: 'The Grand Manila Hotel is a 5-star luxury hotel located in the heart of Makati City, Manila. We offer 350 elegantly appointed rooms and suites, world-class dining, a rooftop infinity pool, and a full-service spa. We have been serving guests since 1998.',
    },
    {
      category: 'property_info' as const,
      question: 'What are the check-in and check-out times?',
      answer: 'Check-in time is 3:00 PM and check-out time is 12:00 PM (noon). Early check-in and late check-out are available upon request and subject to availability. Please contact the front desk to arrange.',
    },
    {
      category: 'property_info' as const,
      question: 'What is the hotel address and contact information?',
      answer: 'The Grand Manila Hotel is located at 123 Ayala Avenue, Makati City, Metro Manila 1226, Philippines. Phone: +63 2 8888 1234. Email: info@thegrandmanila.com.',
    },
    // Rooms & Rates
    {
      category: 'rooms_rates' as const,
      question: 'What room types are available?',
      answer: 'We offer four room categories: Superior Room (32 sqm, from PHP 6,500/night), Deluxe Room (40 sqm, from PHP 8,500/night), Executive Suite (55 sqm, from PHP 12,000/night), and Presidential Suite (120 sqm, from PHP 35,000/night). All rooms include complimentary Wi-Fi, breakfast for two, and access to the fitness center.',
    },
    {
      category: 'rooms_rates' as const,
      question: 'What is included in the room rate?',
      answer: 'All room rates include complimentary buffet breakfast for two at The Grand Kitchen, high-speed Wi-Fi, access to the fitness center and swimming pool, and 24-hour room service. Extra bed is available for PHP 2,000 per night.',
    },
    // Amenities
    {
      category: 'amenities_services' as const,
      question: 'What amenities does the hotel offer?',
      answer: 'Our amenities include: Rooftop infinity pool (open 6 AM - 10 PM), Serenity Spa (full-service, open 9 AM - 9 PM), 24-hour fitness center, Business center, Free high-speed Wi-Fi throughout the property, Concierge services, Valet and self-parking (PHP 500/day), Airport shuttle service (PHP 2,500 one-way to NAIA), and Laundry and dry cleaning service.',
    },
    {
      category: 'amenities_services' as const,
      question: 'Is there parking available?',
      answer: 'Yes, we offer both valet and self-parking at PHP 500 per day. Overnight guests receive complimentary self-parking. The parking garage is located in the basement with direct elevator access to the lobby.',
    },
    {
      category: 'amenities_services' as const,
      question: 'Do you have a swimming pool?',
      answer: 'Yes! Our stunning rooftop infinity pool is located on the 30th floor with panoramic views of the Makati skyline. Pool hours are 6:00 AM to 10:00 PM daily. Towels and lounge chairs are provided complimentary. A poolside bar serves drinks and light meals.',
    },
    // Policies
    {
      category: 'policies' as const,
      question: 'What is the cancellation policy?',
      answer: 'Free cancellation is available up to 48 hours before the check-in date. Cancellations within 48 hours of arrival are subject to a charge equivalent to one night\'s room rate. No-shows will be charged the full reservation amount.',
    },
    {
      category: 'policies' as const,
      question: 'What is the pet policy?',
      answer: 'We welcome small pets (under 10 kg) in designated pet-friendly rooms for an additional fee of PHP 1,500 per night. Please inform us at the time of booking. A pet deposit of PHP 3,000 is required at check-in.',
    },
    {
      category: 'policies' as const,
      question: 'What payment methods do you accept?',
      answer: 'We accept Visa, Mastercard, American Express, JCB, and cash (PHP). We also accept GCash and Maya for incidental charges. A valid credit card is required at check-in for incidentals.',
    },
    // Location & Transport
    {
      category: 'location_transport' as const,
      question: 'How far is the hotel from the airport?',
      answer: 'The Grand Manila is approximately 8 km from Ninoy Aquino International Airport (NAIA). Travel time is 30-60 minutes depending on traffic. We offer airport shuttle service for PHP 2,500 one-way. Grab and taxi are also available at the airport.',
    },
    {
      category: 'location_transport' as const,
      question: 'What attractions are near the hotel?',
      answer: 'We are walking distance from Greenbelt and Glorietta malls (5 min), Ayala Museum (3 min), and the Makati business district. Popular nearby attractions include Intramuros (20 min drive), SM Mall of Asia (30 min), and Bonifacio Global City (15 min).',
    },
    // Dining
    {
      category: 'dining' as const,
      question: 'What restaurants are in the hotel?',
      answer: 'We have three dining venues: The Grand Kitchen (all-day buffet dining, international cuisine, 6 AM - 10 PM), Izakaya Roku (Japanese fine dining, 11:30 AM - 2 PM and 6 PM - 10 PM), and The Sky Lounge (rooftop cocktail bar with small plates, 5 PM - 1 AM). 24-hour room service is also available.',
    },
    {
      category: 'dining' as const,
      question: 'Is breakfast included?',
      answer: 'Yes, complimentary buffet breakfast for two is included with all room bookings. Breakfast is served at The Grand Kitchen from 6:00 AM to 10:00 AM daily. Additional breakfast guests can be accommodated for PHP 1,200 per person.',
    },
    // Custom FAQ
    {
      category: 'custom_faq' as const,
      question: 'Do you have meeting rooms or event spaces?',
      answer: 'Yes, we have 5 meeting rooms (capacity 10-50 pax) and a Grand Ballroom (capacity up to 500 pax). We offer complete event packages including AV equipment, catering, and event coordination. Please contact our events team at events@thegrandmanila.com for inquiries and quotations.',
    },
    {
      category: 'custom_faq' as const,
      question: 'Is there a shuttle to shopping malls?',
      answer: 'Greenbelt and Glorietta malls are a 5-minute walk from the hotel — no shuttle needed! For SM Mall of Asia, we offer a complimentary shuttle that departs at 10 AM, 2 PM, and 6 PM from the lobby, with return trips available.',
    },
  ];

  for (const entry of entries) {
    await db.knowledgeEntry.create({
      data: {
        hotelId: hotel.id,
        ...entry,
        language: 'en',
      },
    });
  }

  console.log(`Created ${entries.length} knowledge base entries`);

  // Add Filipino versions of key entries
  const filipinoEntries = [
    {
      category: 'property_info' as const,
      question: 'Ano ang The Grand Manila Hotel?',
      answer: 'Ang The Grand Manila Hotel ay isang 5-star luxury hotel sa gitna ng Makati City, Manila. Mayroon kaming 350 na eleganteng silid at suite, world-class na kainan, rooftop infinity pool, at full-service spa. Nagsisilbi kami sa mga bisita mula pa noong 1998.',
      language: 'fil',
    },
    {
      category: 'property_info' as const,
      question: 'Anong oras ang check-in at check-out?',
      answer: 'Ang check-in ay alas 3:00 ng hapon at ang check-out ay alas 12:00 ng tanghali. Maaaring mag-request ng early check-in at late check-out, depende sa availability. Mangyaring makipag-ugnayan sa front desk.',
      language: 'fil',
    },
    {
      category: 'rooms_rates' as const,
      question: 'Magkano ang mga kuwarto?',
      answer: 'Mayroon kaming apat na uri ng kuwarto: Superior Room (32 sqm, mula PHP 6,500/gabi), Deluxe Room (40 sqm, mula PHP 8,500/gabi), Executive Suite (55 sqm, mula PHP 12,000/gabi), at Presidential Suite (120 sqm, mula PHP 35,000/gabi). Lahat ng kuwarto may kasama nang Wi-Fi, almusal para sa dalawa, at access sa fitness center.',
      language: 'fil',
    },
  ];

  for (const entry of filipinoEntries) {
    await db.knowledgeEntry.create({
      data: {
        hotelId: hotel.id,
        question: entry.question,
        answer: entry.answer,
        category: entry.category,
        language: entry.language,
      },
    });
  }

  console.log(`Created ${filipinoEntries.length} Filipino knowledge base entries`);
  console.log('Seed complete!');
}

seed()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
