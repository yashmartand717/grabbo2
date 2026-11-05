// Grabbo Web - Site Content
// Edit this file to update products, events and testimonials. No other file needs to change.
//
// Product photos go in public/products/ and are referenced as "/products/<file name>".
// Product categories must match a catalog tab: precautions, beverages, bakery, coffee, snacks.
// A product's "suggestion" (optional) shows as a badge on its photo.

export const products = [
  // --- Precautions & Health ---
  { category: "precautions", name: "N95 Face Mask", desc: "High filtration efficiency mask for protection against viruses & dust.", image: "/products/n95_mask.webp", price: "₹25", suggestion: "Protects against Covid & Viruses" },
  { category: "precautions", name: "Dettol Hand Sanitizer", desc: "Kills 99.9% of germs without water. Essential pocket protection.", image: "/products/sanitizer.webp", price: "₹50", suggestion: "Prevents Viral Infections" },
  { category: "precautions", name: "Lifebuoy Total 10 Soap", desc: "Advanced germ protection soap with silver shield formula.", image: "/products/soap.webp", price: "₹38", suggestion: "Washes away germs" },
  { category: "precautions", name: "Odomos Mosquito Repellent", desc: "Clinically tested cream for Dengue and Malaria protection.", image: "/products/repellent.webp", price: "₹65", suggestion: "Helps in Dengue & Malaria" },
  { category: "precautions", name: "Savlon Antiseptic Liquid", desc: "First aid disinfectant liquid for wounds, cuts & personal hygiene.", image: "/products/antiseptic.webp", price: "₹45", suggestion: "First aid & hygiene" },
  { category: "precautions", name: "Crocin Advance Tablet", desc: "Fast-acting relief for fever, headache, and body aches.", image: "/products/crocin.webp", price: "₹20", suggestion: "Relieves Fever & Pain" },
  { category: "precautions", name: "Vicks VapoRub", desc: "Effective multi-symptom relief from cold, cough, and blocked nose.", image: "/products/vicks.webp", price: "₹55", suggestion: "Relieves Cold & Cough" },
  { category: "precautions", name: "Electral ORS Powder", desc: "WHO-based oral rehydration salts formula for dehydration & fatigue.", image: "/products/electral.webp", price: "₹22", suggestion: "Prevents Dehydration" },
  { category: "precautions", name: "Digital Thermometer", desc: "Quick 10-second accurate digital body temperature measurement.", image: "/products/thermometer.webp", price: "₹180", suggestion: "Checks Fever Accurately" },

  // --- Beverages & Shakes ---
  { category: "beverages", name: "Alo Frut Blood Orange Mojito", desc: "Refreshing mocktail with tangy blood orange and real aloe vera.", image: "/products/alo_frut_orange.webp", price: "₹40" },
  { category: "beverages", name: "Alo Frut Kiwi Mojito", desc: "Crisp sweet and sour kiwi refreshment packed with aloe pulp.", image: "/products/alo_frut_kiwi.webp", price: "₹40" },
  { category: "beverages", name: "Amul Badam Shaker", desc: "Rich and creamy almond flavored milk with real badam bits.", image: "/products/amul_badam.webp", price: "₹35" },
  { category: "beverages", name: "Amul Kool Kesar", desc: "Classic saffron-infused chilled milk for an instant energy boost.", image: "/products/amul_kool_kesar.webp", price: "₹30" },
  { category: "beverages", name: "Coolberg Cranberry", desc: "Non-alcoholic craft cranberry malt beer with rich fruity notes.", image: "/products/coolberg.webp", price: "₹85" },
  { category: "beverages", name: "Coolberg Peach", desc: "Crisp and aromatic non-alcoholic peach flavored malt beverage.", image: "/products/coolberg.webp", price: "₹85" },
  { category: "beverages", name: "Schweppes Tonic Water", desc: "Crisp, bubbly Indian tonic water with delicate citrus quinine notes.", image: "/products/schweppes_tonic.webp", price: "₹60" },
  { category: "beverages", name: "Schweppes Ginger Ale", desc: "Bubbly golden ginger ale with a sharp and refreshing kick.", image: "/products/schweppes_ginger_ale.webp", price: "₹60" },
  { category: "beverages", name: "Epigamia Milkshake Vanilla", desc: "High protein, creamy milkshake enriched with real vanilla & calcium.", image: "/products/epigamia_vanilla.webp", price: "₹40" },
  { category: "beverages", name: "Raw Pressery Aam Panna", desc: "Traditional Indian raw mango cooler packed with electrolytes.", image: "/products/raw_pressery_aam_panna.webp", price: "₹70" },
  { category: "beverages", name: "Hell Energy Watermelon", desc: "High-octane watermelon energy drink with B-vitamins & taurine.", image: "/products/hell_energy.webp", price: "₹60" },
  { category: "beverages", name: "Amul Sweet Lassi", desc: "Thick, traditional probiotic sweet yogurt drink served chilled.", image: "/products/amul_lassi.webp", price: "₹25" },
  { category: "beverages", name: "Amul Masti Buttermilk", desc: "Refreshing spiced cooling chaas with curry leaves & ginger.", image: "/products/amul_buttermilk.webp", price: "₹15" },
  { category: "beverages", name: "Sofit Soya Milk Chocolate", desc: "Plant-based dairy-free chocolate milk rich in protein & omega-3.", image: "/products/sofit_choco.webp", price: "₹38" },
  { category: "beverages", name: "Hershey's Cookies & Cream", desc: "Thick and indulgent cookies & cream chocolate milkshake.", image: "/products/hersheys_cookies_cream.webp", price: "₹45" },

  // --- Coffee & Pantry ---
  { category: "coffee", name: "Davidoff Fine Aroma Coffee", desc: "100% Arabica luxury instant coffee with delicate acidic notes.", image: "/products/davidoff_coffee.webp", price: "₹550" },
  { category: "coffee", name: "Grabbo Special Hot Coffee", desc: "Freshly brewed rich espresso roast coffee made to order.", image: "/products/grabbo_hot_coffee.webp", price: "₹30" },
  { category: "coffee", name: "Maggi Masala Special Noodles", desc: "Classic late-night 2 AM companion cooked piping hot with veggies.", image: "/products/maggi_noodles.webp", price: "₹40" },

  // --- Bakery & Sweets ---
  { category: "bakery", name: "Winkies Mango Swiss Roll", desc: "Soft, fluffy sponge roll wrapped around luscious mango cream.", image: "/products/winkies_swiss_roll.webp", price: "₹25" },
  { category: "bakery", name: "Winkies Rich Butter Fruit Cake", desc: "Golden butter sponge loaded with candied fruit bits and raisins.", image: "/products/winkies_fruit_cake.webp", price: "₹30" },
  { category: "bakery", name: "Winkies Sliced Choco Cake", desc: "Decadent dark chocolate slice cake with cocoa drizzle.", image: "/products/winkies_choco_cake.webp", price: "₹25" },

  // --- Snacks & Chips ---
  { category: "snacks", name: "Bingo! Cheese Nachos", desc: "Crunchy golden corn tortilla chips layered with cheesy tang.", image: "/products/bingo_nachos.webp", price: "₹30" },
  { category: "snacks", name: "Bingo! Mad Angles Achaari", desc: "Perfect triangular crunchy chips coated in zesty achaari masala.", image: "/products/bingo_mad_angles.webp", price: "₹20" },
  { category: "snacks", name: "Fun Flips Baked Puffs", desc: "Classic nostalgic khatta-meetha crunchy baked corn puffs.", image: "/products/fun_flips_puffs.webp", price: "₹15" }
];

// Upcoming events are shown on both the About page and the Events page, in this order.
// "endDate" (YYYY-MM-DD) is the event's last day: from the next day it moves to "Past Events"
// on the Events page automatically. Delete an event to remove it from the site entirely.
// With no upcoming events, both pages show a "follow us" note instead.
// "featured: true" gives an event the large card layout.
export const events = [
  {
    featured: true,
    endDate: "2026-10-26",
    title: "JALSA 2.0",
    image: "/events/jalsa_event_collage.jpg",
    imageAlt: "JALSA 2.0 Event by Grabbo at Shiv Nadar University",
    imageBadge: "✨ Featured Campus Event",
    status: "🎉 Grand Campus Celebration",
    tag: "Breeze × Grabbo",
    desc: "An unforgettable festive night hosted by Grabbo in collaboration with Breeze at Shiv Nadar University! A high-energy evening of music, Garba & Dandiya dance, and delectable snacks curated directly by Grabbo.",
    date: "October 26th • 6:00 PM – 10:00 PM",
    location: "Library Lawn, Shiv Nadar University",
    host: "Grabbo @ Shopping Arcade × Breeze",
    perk: "🪔 Music, Dandiya, Delectable Grabbo Snacks & Refreshments"
  }
];

// "Weather at SNU" section: food picks for the current weather on campus.
// Product names must match a product's "name" above exactly; unknown names are skipped.
// Which mood applies: rainy if it is raining, otherwise by temperature —
// hot 32°C and above, warm 26–32°C, pleasant 18–26°C, cold below 18°C.
export const weatherSuggestions = {
  hot: {
    icon: "☀️",
    title: "Beat the Heat",
    subtitle: "It's scorching at SNU. Cool down with chilled coolers and stay hydrated.",
    products: ["Raw Pressery Aam Panna", "Amul Masti Buttermilk", "Amul Sweet Lassi", "Alo Frut Blood Orange Mojito", "Schweppes Tonic Water", "Electral ORS Powder"]
  },
  warm: {
    icon: "🌤️",
    title: "Warm Day Refreshers",
    subtitle: "A warm one on campus. Grab something cold and fizzy between classes.",
    products: ["Coolberg Cranberry", "Epigamia Milkshake Vanilla", "Hershey's Cookies & Cream", "Amul Kool Kesar", "Alo Frut Kiwi Mojito", "Hell Energy Watermelon"]
  },
  rainy: {
    icon: "🌧️",
    title: "Rainy Day Cravings",
    subtitle: "It's raining at SNU. Nothing beats hot Maggi, coffee and crunchy snacks.",
    products: ["Maggi Masala Special Noodles", "Grabbo Special Hot Coffee", "Bingo! Cheese Nachos", "Bingo! Mad Angles Achaari", "Fun Flips Baked Puffs", "Winkies Rich Butter Fruit Cake"]
  },
  pleasant: {
    icon: "🍃",
    title: "Perfect Weather Picks",
    subtitle: "Lovely weather on campus. Ideal for coffee and a sweet bite with friends.",
    products: ["Grabbo Special Hot Coffee", "Winkies Mango Swiss Roll", "Winkies Rich Butter Fruit Cake", "Amul Badam Shaker", "Epigamia Milkshake Vanilla", "Bingo! Cheese Nachos"]
  },
  cold: {
    icon: "🧣",
    title: "Warm Up, SNU",
    subtitle: "Chilly out there. Warm yourself up with something hot and comforting.",
    products: ["Grabbo Special Hot Coffee", "Davidoff Fine Aroma Coffee", "Maggi Masala Special Noodles", "Winkies Sliced Choco Cake", "Winkies Rich Butter Fruit Cake", "Sofit Soya Milk Chocolate"]
  }
};

// Health news only shows headlines from these outlets (website domains, without "www.").
// Add or remove a domain to change which outlets are trusted.
export const newsSources = [
  "indiatoday.in",
  "hindustantimes.com",
  "timesofindia.indiatimes.com",
  "economictimes.indiatimes.com",
  "economictimes.com",
  "ndtv.com",
  "indianexpress.com",
  "newindianexpress.com",
  "thehindu.com",
  "theprint.in",
  "livemint.com",
  "business-standard.com",
  "news18.com",
  "moneycontrol.com",
  "timesnownews.com",
  "deccanherald.com",
  "tribuneindia.com",
  "pib.gov.in",
  "mohfw.gov.in",
  "who.int"
];

// Shown in the "What The Campus Says" scrolling section.
export const testimonials = [
  {
    badge: "Late Night Savior",
    text: "Grabbo is literally the reason I survived mid-sem exams. Having hot Maggi, chilled Red Bull, and stationery available at 2 AM inside the arcade is a blessing for hostelers!",
    author: "Aarav Sharma",
    role: "3rd Year B.Tech CSE • SNU Hostel 3",
    avatar: "AS"
  },
  {
    badge: "Local Vocal Fan",
    text: "The 'Local Vocal' sessions at Grabbo are unmatched! Performing acoustic sets on open mic nights while enjoying cold hazelnut brew has created my best campus memories.",
    author: "Sneha Mukherjee",
    role: "2nd Year B.Des • Campus Culture Club",
    avatar: "SM"
  },
  {
    badge: "Daily Convenience",
    text: "As faculty living on campus, having a full-fledged departmental store with fresh bakery, pantry staples, and prompt doorstep delivery makes university life so seamless.",
    author: "Prof. Rajesh Verma",
    role: "Faculty Resident • Shiv Nadar University",
    avatar: "RV"
  },
  {
    badge: "Breeze & Events",
    text: "JALSA 2.0 collaboration between Breeze and Grabbo was the absolute highlight of the semester! Great music, festive Dandiya energy, and delicious street snacks.",
    author: "Ananya Gupta",
    role: "4th Year BMS • Student Council",
    avatar: "AG"
  },
  {
    badge: "Distant Parent Care",
    text: "Sending care essentials to our son from Bengaluru used to worry us until we found Grabbo’s parent support desk. They ensure timely deliveries and warm care for our ward!",
    author: "Meenakshi & Suresh Iyer",
    role: "Parents from Bengaluru • Grabbo Connect",
    avatar: "MI"
  },
  {
    badge: "Energy & Refreshments",
    text: "For all our sports tournaments and late practice matches, Grabbo supplied energy drinks, electrolytes, and wholesome snacks without any delay. Highly dependable!",
    author: "Rohan Mehta",
    role: "Club President • SNU Sports Society",
    avatar: "RM"
  }
];
