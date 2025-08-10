// Initial Canadian climbing facilities seed data
// This can be expanded over time or replaced by generator output

export type FacilitySeed = {
  name: string;
  city?: string;
  province: string;
  country: "Canada";
  address?: string;
};

export const facilitiesCA: FacilitySeed[] = [
  // ——— BRITISH COLUMBIA ———
  { name: "BoulderHouse", city: "Victoria", province: "British Columbia", country: "Canada" },
  { name: "Bv Pool and Rec Center", city: "Smithers", province: "British Columbia", country: "Canada" },
  { name: "Cliffhanger Climbing Gym", city: "Vancouver", province: "British Columbia", country: "Canada" },
  { name: "Cliffside Climbing Gym", city: "Kamloops", province: "British Columbia", country: "Canada" },
  { name: "Climb Base5", city: "Coquitlam", province: "British Columbia", country: "Canada" },
  { name: "Climb Ground Up", city: "Squamish", province: "British Columbia", country: "Canada" },
  { name: "Confluence Climbing and Fitness", city: "Golden", province: "British Columbia", country: "Canada" },
  { name: "Cowichan Climbing Academy", city: "Duncan", province: "British Columbia", country: "Canada" },
  { name: "Crag X Indoor Climbing Centre", city: "Victoria", province: "British Columbia", country: "Canada" },
  { name: "Flux Climbing", city: "Rossland", province: "British Columbia", country: "Canada" },
  { name: "gneiss climbing", city: "Kelowna", province: "British Columbia", country: "Canada" },
  { name: "Hoodoo Adventure Co Ltd", city: "Penticton", province: "British Columbia", country: "Canada" },
  { name: "On The Rocks Climbing Gym", city: "Campbell River", province: "British Columbia", country: "Canada" },
  { name: "OVERhang", city: "Prince George", province: "British Columbia", country: "Canada" },
  { name: "Project Climbing Centre – Abbotsford", city: "Abbotsford", province: "British Columbia", country: "Canada" },
  { name: "Project Climbing Centre, Cloverdale", city: "Surrey", province: "British Columbia", country: "Canada" },
  { name: "Richmond Olympic Oval", city: "Richmond", province: "British Columbia", country: "Canada" },
  { name: "Romper Room Indoor Rock Climbing", city: "Nanaimo", province: "British Columbia", country: "Canada" },
  { name: "Shuswap Gym of Rock", city: "Salmon Arm", province: "British Columbia", country: "Canada" },
  { name: "Simon Fraser University Climbing Wall", city: "Burnaby", province: "British Columbia", country: "Canada" },
  { name: "Squamish Athletic Club", city: "Squamish", province: "British Columbia", country: "Canada" },
  { name: "The Boulders Climbing Gym", city: "Central Saanich", province: "British Columbia", country: "Canada" },
  { name: "The CUBE", city: "Nelson", province: "British Columbia", country: "Canada" },
  { name: "The Hive Climbing Centres", city: "Vancouver", province: "British Columbia", country: "Canada" },
  { name: "The Rock Garden Climbing Center", city: "Vernon", province: "British Columbia", country: "Canada" },
  { name: "The Rock Wall Climbing Gym", city: "Maple Ridge", province: "British Columbia", country: "Canada" },

  // ——— ALBERTA ———
  { name: "Big Rock Bouldering", city: "Okotoks", province: "Alberta", country: "Canada" },
  { name: "BLOCS", city: "Edmonton", province: "Alberta", country: "Canada" },
  { name: "Bolder Climbing Inc", city: "Calgary", province: "Alberta", country: "Canada" },
  { name: "Elevation Place", city: "Canmore", province: "Alberta", country: "Canada" },

  // ——— SASKATCHEWAN ———
  { name: "Climbing Centre", city: "Regina", province: "Saskatchewan", country: "Canada" },
  { name: "Grip It Climbing", city: "Saskatoon", province: "Saskatchewan", country: "Canada" },

  // ——— MANITOBA ———
  { name: "The Hive Climbing", city: "Winnipeg", province: "Manitoba", country: "Canada" },
  { name: "University of Manitoba Climbing Wall", city: "Winnipeg", province: "Manitoba", country: "Canada" },
  { name: "Vertical Adventures", city: "Winnipeg", province: "Manitoba", country: "Canada" },

  // ——— ONTARIO ———
  { name: "Ajax Rock Oasis", city: "Ajax", province: "Ontario", country: "Canada" },
  { name: "Altitude Gym", city: "Kanata", province: "Ontario", country: "Canada" },
  { name: "Alt. Rock", city: "Barrie", province: "Ontario", country: "Canada" },
  { name: "Aspire Climbing Whitby", city: "Whitby", province: "Ontario", country: "Canada" },
  { name: "Boiler Room Climbing Gym", city: "Kingston", province: "Ontario", country: "Canada" },
  { name: "Boiler Room Climbing Gym", city: "Belleville", province: "Ontario", country: "Canada" },
  { name: "Boulder Parc", city: "Scarborough", province: "Ontario", country: "Canada" },
  { name: "Boulderz Climbing Centre", city: "Toronto", province: "Ontario", country: "Canada" },
  { name: "Cave Rock Climbing", city: "Mississauga", province: "Ontario", country: "Canada" },
  { name: "Climber’s Rock", city: "Burlington", province: "Ontario", country: "Canada" },
  { name: "Coyote Rock Gym", city: "Ottawa", province: "Ontario", country: "Canada" },
  { name: "Grand River Rocks", city: "Kitchener", province: "Ontario", country: "Canada" },
  { name: "Grand River Rocks", city: "Waterloo", province: "Ontario", country: "Canada" },
  { name: "Hub Climbing Mississauga", city: "Mississauga", province: "Ontario", country: "Canada" },
  { name: "Junction Climbing Centre", city: "London", province: "Ontario", country: "Canada" },
  { name: "The Core Climbing Gym", city: "Cambridge", province: "Ontario", country: "Canada" },
  { name: "The Rock Oasis", city: "Toronto", province: "Ontario", country: "Canada" }, // moved from BC
  { name: "Toprock Climbing", city: "Brampton", province: "Ontario", country: "Canada" },
  { name: "True North Climbing, Inc", city: "Toronto", province: "Ontario", country: "Canada" },
  { name: "Up The Bloc", city: "Mississauga", province: "Ontario", country: "Canada" },
  { name: "Windsor Rock Gym", city: "Windsor", province: "Ontario", country: "Canada" },

  // ——— QUÉBEC ———
  { name: "Altitude Gym", city: "Gatineau", province: "Québec", country: "Canada" },
  { name: "Beta Bloc", city: "Dorval", province: "Québec", country: "Canada" },
  { name: "Bloc Shop", city: "Montréal", province: "Québec", country: "Canada" },
  { name: "Café Bloc", city: "Montréal", province: "Québec", country: "Canada" },
  { name: "Canyon Escalade", city: "La Prairie", province: "Québec", country: "Canada" },
  { name: "Centre d’escalade Horizon Roc", city: "Montréal", province: "Québec", country: "Canada" },
  { name: "Centre Multisports", city: "Vaudreuil-Dorion", province: "Québec", country: "Canada" },
  { name: "Climberz", city: "Quebec", province: "Québec", country: "Canada" },
  { name: "Délire Escalade – Beauport", city: "Québec", province: "Québec", country: "Canada" },
  { name: "Hook Bouldering Center Inc.", city: "Ste-Julie", province: "Québec", country: "Canada" },
  { name: "Klimat", city: "Wakefield", province: "Québec", country: "Canada" },
  { name: "La Boîte à grimpe", city: "Saguenay", province: "Québec", country: "Canada" },
  { name: "La Débarque", city: "Repentigny", province: "Québec", country: "Canada" },
  { name: "le CRUX", city: "Boisbriand", province: "Québec", country: "Canada" },
  { name: "Le Mouv’ espace bloc", city: "Montreal", province: "Québec", country: "Canada" },
  { name: "Nomad Bloc", city: "Montréal", province: "Québec", country: "Canada" },
  { name: "Plein d’air centre d’escalade", city: "Granby", province: "Québec", country: "Canada" },
  { name: "Shakti Rock Gym", city: "Montreal", province: "Québec", country: "Canada" },
  { name: "Vertige Escalade", city: "Sherbrooke", province: "Québec", country: "Canada" },
  { name: "Zéro Gravité", city: "Montréal", province: "Québec", country: "Canada" },

  // ——— NEW BRUNSWICK ———
  { name: "Canadian Forces Base Gagetown Climbing Wall", city: "Oromocto", province: "New Brunswick", country: "Canada" },
  { name: "Fredericton Bouldering Co-op", city: "Fredericton", province: "New Brunswick", country: "Canada" },
  { name: "URec", city: "Fredericton", province: "New Brunswick", country: "Canada" },

  // ——— NOVA SCOTIA ———
  { name: "Seven Bays Bouldering", city: "Halifax", province: "Nova Scotia", country: "Canada" },
  { name: "The Rock Court", city: "Halifax", province: "Nova Scotia", country: "Canada" },

  // ——— NEWFOUNDLAND AND LABRADOR ———
  { name: "Wallnuts Climbing Centre", city: "St. John’s", province: "Newfoundland and Labrador", country: "Canada" },
];