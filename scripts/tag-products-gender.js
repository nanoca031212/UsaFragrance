/**
 * Adds men/women gender tags to products in unified_products_en_gbp.json
 * Run with --apply to write changes. Dry-run by default.
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data', 'unified_products_en_gbp.json');
const APPLY = process.argv.includes('--apply');

// Read file handling BOM
let raw = fs.readFileSync(filePath);
if (raw[0] === 0xEF && raw[1] === 0xBB && raw[2] === 0xBF) {
  raw = raw.slice(3);
}
const content = raw.toString('utf8');
const data = JSON.parse(content);

function norm(s) {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

const MEN = [
  "1 Million Paco Rabanne",
  "1 Million Parfum Paco Rabanne",
  "212 Men",
  "Acqua di Gio Profondo Giorgio Armani",
  "Armaf Club de Nuit Intense Man Armaf",
  "Armani Beauty Eau pour Homme Pour homme",
  "Armani Code Giorgio Armani",
  "Azzaro Pour Homme Eau De Toilette",
  "Bad Boy Carolina Herrera",
  "Bleu de Chanel Chanel",
  "Bleu De Chanel Parfum",
  "Boss Bottled Infinite Hugo Boss",
  "Boss The Scent Hugo Boss",
  "Bulgari In Black Bulgari",
  "Creed Aventus Creed",
  "Dior Sauvage Dior",
  "Eau de Parfum Guerlain L'Homme Idéal L'Intense",
  "Emporio Armani Stronger With You",
  "Ferrari Black Ferrari",
  "Gentleman Réserve Privée Givenchy",
  "Givenchy Gentleman Givenchy",
  "Gucci Guilty Pour Homme Gucci",
  "Hugo Boss Perfume Bottled",
  "Invictus Paco Rabanne",
  "Invictus Victory Paco Rabanne Edp",
  "Issey Miyake Nuit d'Issey",
  "Jean Paul Gaultier Le Male Jean Paul Gaultier",
  "Jean Paul Gaultier Le Male Elixir",
  "Jean Paul Gaultier Scandal H.",
  "Kenzo Homme Eau de Parfum",
  "Louis Vuitton Imagination Louis Vuitton",
  "Montblanc Explorer Extreme Eau De",
  "Moschino Toy Boy Moschino",
  "Paco Rabanne Phantom Paco Rabanne",
  "Paco Rabanne Pure XS",
  "Paco Rabanne Ultra Male",
  "Prada Luna Rossa Black Prada",
  "Rabanne Phantom Parfum",
  "Scandal Pour Homme",
  "Silver Scent Jacques Bogart",
  "Valentino Uomo Valentino",
  "Dylan Blue Versace",
  "Versace Eros Versace",
  "Y by YSL",
  "Y Eau de Parfum Yves Saint Laurent",
  "Y Le Parfum da marca Yves Saint Laurent",
].map(norm);

const WOMEN = [
  "212 VIP Rose Carolina Herrera",
  "Amadeirado Floral Fragrância Marcante",
  "Mugler Alien Eau Extraordinaire Mugler",
  "Angel Mugler Les Perfuma Corps",
  "Armani Beauty Sì Eau de Parfum Refilável",
  "YSL Black Opium Yves Saint Laurent",
  "Burberry Her Eau de Parfum",
  "Miss 212 Carolina Herrera",
  "Good Girl Carolina Herrera",
  "Chloe Signature Chloe",
  "Coco Mademoiselle Chanel",
  "Creed Love in White Creed",
  "Dior Hypnotic Poison Dior",
  "Dior J'adore Dior",
  "Frederic Malle Portrait of a Lady Frederic Malle",
  "Giorgio Armani Si Giorgio Armani",
  "Givenchy Amarige Givenchy",
  "Givenchy L'Interdit Givenchy",
  "Gucci Flora Gorgeous Gardenia Gucci",
  "Lancôme La Nuit Trésor Fem",
  "La Vie Est Belle Lancome",
  "Libre Yves Saint Laurent",
  "Marc Jacobs Perfect Marc Jacobs",
  "Million Gold for Her",
  "Montblanc Signature Absolue",
  "Paco Rabanne Olympéa",
  "Paradoxe Prada",
  "Fame Paco Rabanne",
  "D&G The Only One",
  "Valentino Donna Born in Roma Valentino",
  "Dylan Turquoise Versace",
  "Versace Eros Pour Femme",
  "Mon Paris Yves Saint Laurent",
  "Mugler Angel Mugler",
].map(norm);

// Unisex → gets both "men" and "women"
const UNISEX = [
  "Byredo Rose of No Man's Land Byredo",
  "Parfums de Marly Layton",
  "D&G Light Blue",
  "French Avenue Royal Blend Extrait De Parfum",
  "Initio Oud for Greatness Initio",
  "Le Labo Santal 33 Le Labo",
  "M. Micallef GnTonic",
  "Orientica Royal Bleu Eau De Parfum",
  "Tom Ford Tobacco Vanille",
  "Xerjoff Erba Pura Xerjoff",
].map(norm);

const changes = [];
const unmatched = [];

data.products.forEach(product => {
  const t = norm(product.title);
  const tagsToAdd = [];

  if (MEN.includes(t) || UNISEX.includes(t)) tagsToAdd.push('men');
  if (WOMEN.includes(t) || UNISEX.includes(t)) tagsToAdd.push('women');

  if (tagsToAdd.length === 0) {
    unmatched.push({ id: product.id, title: product.title });
    return;
  }

  const current = product.tags || [];
  const newTags = tagsToAdd.filter(tag => !current.includes(tag));

  if (newTags.length > 0) {
    changes.push({ id: product.id, title: product.title, adding: newTags });
    if (APPLY) product.tags = [...current, ...newTags];
  }
});

console.log('=== GENDER TAGS — PREVIEW ===\n');
console.log('Products that will be updated:');
changes.forEach(c =>
  console.log(`  [${String(c.id).padStart(2)}] ${c.title.padEnd(55)} +[${c.adding.join(', ')}]`)
);

if (unmatched.length) {
  console.log('\nProducts with NO gender match (unchanged):');
  unmatched.forEach(u => console.log(`  [${String(u.id).padStart(2)}] ${u.title}`));
}

console.log(`\nSummary: ${changes.length} products updated, ${unmatched.length} unmatched`);

if (APPLY) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log('\n✔ File written successfully.');
} else {
  console.log('\nRun with --apply to write changes.');
}
