import { db } from "../db";
import { hymns } from "@shared/schema";
import { eq } from "drizzle-orm";

let seeded = false;

const FRENCH_HYMNS = [
  {
    title: "Quel ami fidèle et tendre",
    lyrics: `Quel ami fidèle et tendre
Nous avons en Jésus-Christ,
Toujours prêt à nous entendre,
À répondre à notre cri!
Il connaît nos défaillances,
Nos chutes de chaque jour;
Sévère en ses exigences,
Il est riche en son amour.

Quel ami fidèle et tendre
Nous avons en Jésus-Christ,
Toujours prêt à nous comprendre
Quand on souffre, quand on crie!
Disons-lui toutes nos craintes,
Ouvrons-lui tout notre coeur,
Ses compassions sont sans bornes,
Lui seul guérit nos douleurs.

Quel ami fidèle et tendre
Nous avons en Jésus-Christ,
Toujours prêt à nous défendre
Quand nous presse l'ennemi!
Il nous suit dans la mêlée,
Nous soutient au mauvais jour;
Oui, son aide est assurée,
Fruit de son constant amour.`,
    composer: "Charles C. Converse / Joseph M. Scriven",
    year: 1855,
    tags: ["amitié", "prière", "foi"],
    language: "fr"
  },
  {
    title: "À toi la gloire",
    lyrics: `À toi la gloire, Ô Ressuscité!
À toi la victoire pour l'éternité!
Brillant de lumière, l'ange est descendu,
Il roule la pierre du tombeau vaincu.
À toi la gloire, Ô Ressuscité!
À toi la victoire pour l'éternité!

Vois-le paraître: c'est lui, c'est Jésus,
Ton Sauveur, ton Maître, oh! ne doute plus!
Sois dans l'allégresse, peuple du Seigneur,
Et redis sans cesse que Christ est vainqueur.
À toi la gloire, Ô Ressuscité!
À toi la victoire pour l'éternité!

Craindrais-je encore? Il vit à jamais,
Celui que j'adore, le Prince de paix;
Il est ma victoire, mon puissant soutien,
Ma vie et ma gloire: non, je ne crains rien.
À toi la gloire, Ô Ressuscité!
À toi la victoire pour l'éternité!`,
    composer: "Georg Friedrich Händel / Edmond Budry",
    year: 1884,
    tags: ["pâques", "résurrection", "louange"],
    language: "fr"
  },
  {
    title: "Jésus, que ma joie demeure",
    lyrics: `Jésus, que ma joie demeure,
Toi qui es toute bonté,
Jésus, que ma joie demeure,
Toi qui règnes en beauté.

Près de toi, je vis heureux,
Loin de toi, je suis malheureux.
Mon Sauveur, garde mon âme,
Qu'en toi seul elle se pâme.

Jésus, ma force et ma vie,
Mon bouclier, mon appui,
Jésus, en toi je me fie,
Tu es mon seul aujourd'hui.

Quand le monde m'abandonne,
Ta main me soutient encore.
Jésus, à toi je me donne,
Tu es mon unique trésor.`,
    composer: "Johann Sebastian Bach / Martin Jahn",
    year: 1723,
    tags: ["joie", "paix", "foi"],
    language: "fr"
  },
  {
    title: "Toi qui disposes",
    lyrics: `Toi qui disposes de toutes choses
Et nous les donnes chaque jour,
Reçois, Seigneur, nos prières
Comme un parfum qui s'élève vers toi.

Toi qui sans cesse viens nous bénir,
Nous voulons te servir.
Toi qui es riche en bonté,
Reçois notre louange en ta présence.

Nous t'adorons, Dieu notre Père,
Nous proclamons ta sainteté.
Ton nom est grand sur la terre,
Et ta gloire emplit l'éternité.`,
    composer: "Matthäus Appelles von Löwenstern",
    year: 1644,
    tags: ["louange", "adoration", "prière"],
    language: "fr"
  },
  {
    title: "Reste avec nous, Seigneur",
    lyrics: `Reste avec nous, Seigneur, le jour décline,
La nuit s'approche et nous menace tous;
Nous implorons ta présence divine:
Reste avec nous, Seigneur, reste avec nous!

Nous n'avons pas d'autre ami sur la terre,
Toi seul, Jésus, consoles notre coeur;
Toi seul nous donnes, au milieu de la guerre,
La paix et le repos. Reste, Seigneur!

Reste avec nous quand tout passe et succombe,
Quand vient la mort, quand approche la nuit;
Conduis nos pas au-delà de la tombe,
Reste avec nous jusqu'à l'éternité!`,
    composer: "Henry Francis Lyte / William H. Monk",
    year: 1847,
    tags: ["soir", "paix", "foi"],
    language: "fr"
  },
  {
    title: "Louange à toi",
    lyrics: `Louange à toi, ô Dieu puissant!
Louange à toi, Père éternel!
Du haut des cieux tu nous entends,
Et ton amour est immortel.

Louange à toi, Jésus-Christ!
Sauveur du monde, notre Roi!
Par ta mort tu nous as conquis,
Et nous vivons désormais en toi.

Louange à toi, Saint-Esprit!
Consolateur envoyé d'en haut!
Tu guides nos pas, tu nous conduis
Au sein de ton repos si beau.

Louange au Père, au Fils, à l'Esprit,
Un seul vrai Dieu en trois personnes!
Que notre vie à toi soit unie,
Que notre coeur à toi se donne!`,
    composer: "Traditionnel",
    year: null,
    tags: ["louange", "trinité", "adoration"],
    language: "fr"
  },
  {
    title: "Grand Dieu, nous te bénissons",
    lyrics: `Grand Dieu, nous te bénissons,
Nous célébrons tes louanges,
Éternel, nous t'exaltons,
De concert avec les anges,
Et, prosternés devant toi,
Nous t'adorons, ô grand Roi!

Les cieux et leurs habitants
Te rendent hommage et gloire;
Les chérubins triomphants
Te proclament en victoire;
Saint, saint, saint est l'Éternel,
Le Seigneur, Dieu d'Israël!

Oui, tu règnes à jamais,
Dieu puissant et redoutable;
Ta grâce et ta grande paix
Sont nos trésors véritables;
Gloire au Père, au Fils, à l'Esprit,
Notre Dieu de paradis!`,
    composer: "Ignaz Franz",
    year: 1774,
    tags: ["louange", "adoration", "majesté"],
    language: "fr"
  },
  {
    title: "Oh! que ta main paternelle",
    lyrics: `Oh! que ta main paternelle
Me bénisse à mon coucher!
Un jour de plus, Dieu fidèle,
Tu m'as aidé à marcher.

Pardonne-moi mes offenses,
Comme je pardonne aussi;
Et que tes saintes promesses
Remplissent mon coeur ici.

Pendant la nuit, que ta grâce
Me garde de tout danger;
Et que demain ta face
Brille sur moi, ô Berger!

Fais reposer sous ton aile
Ma famille et tous mes amis;
Reste avec nous, Père fidèle,
Jusqu'au lever du jour béni!`,
    composer: "César Malan",
    year: 1830,
    tags: ["soir", "prière", "protection"],
    language: "fr"
  },
  {
    title: "Merveilleux est le nom de Jésus",
    lyrics: `Merveilleux est le nom de Jésus,
Il est le Dieu puissant,
Admirable Conseiller,
Emmanuel, le Roi des rois.

Merveilleux est le nom de Jésus,
Prince de la paix,
Père éternel,
Le Tout-Puissant.

Adorons-le, célébrons-le,
Chantons sa gloire à jamais;
Car son règne est éternel,
Et son amour nous soutient.`,
    composer: "Traditionnel",
    year: null,
    tags: ["louange", "adoration", "nom de Jésus"],
    language: "fr"
  },
  {
    title: "Comme un cerf altéré",
    lyrics: `Comme un cerf altéré brame
Après les eaux des ruisseaux,
Ainsi soupire mon âme
Après toi, Dieu des hauts lieux.

Mon âme a soif du Dieu fort,
Du Dieu vivant et fidèle;
Quand viendra le jour de mort
Où je verrai sa face belle?

Mes larmes sont ma nourriture,
Le jour comme aussi la nuit;
On me dit chaque heure qui dure:
"Où donc est ton Dieu qui luit?"

Pourquoi te troubles-tu, mon âme?
Pourquoi gémir au-dedans?
Espère en Dieu, qu'on l'acclame!
Je le louerai dans tous les temps.`,
    composer: "Louis Bourgeois / Clément Marot",
    year: 1551,
    tags: ["psaume", "soif de Dieu", "espérance"],
    language: "fr"
  },
  {
    title: "C'est un rempart que notre Dieu",
    lyrics: `C'est un rempart que notre Dieu,
Une invincible armure,
Notre délivrance en tout lieu,
Notre défense sûre.
L'ennemi contre nous
Redouble de courroux:
Vaine est sa fureur!
Son but est le malheur;
Son arme est la terreur:
Mais un seul peut le mettre à bas.

Seuls, nous bronchons à chaque pas,
Notre force est faiblesse;
Mais un héros, dans les combats,
Pour nous lutte sans cesse.
Quel est ce défenseur?
C'est toi, divin Sauveur,
Dieu des armées!
Tes tribus opprimées
Connaissent ta puissance
Et ton bras rédempteur.

Que les démons forgent des fers
Pour accabler l'Église;
Ta Sion brave les enfers,
Sur le rocher assise.
Que Satan en fureur
Souffle sa rage au coeur
De nos persécuteurs!
Ton bras les mettra bas:
Ta parole est un glaive qui tranche
Le mensonge et l'erreur.`,
    composer: "Martin Luther",
    year: 1529,
    tags: ["réforme", "protection", "foi"],
    language: "fr"
  },
  {
    title: "Ô nuit de paix",
    lyrics: `Ô nuit de paix! Sainte nuit!
Dans le ciel, l'astre luit;
Dans les champs tout repose en paix;
Mais soudain, dans l'air pur et frais,
Le brillant choeur des anges
Aux bergers apparaît.

Ô nuit de paix! Sainte nuit!
Les bergers sont instruits:
Confiants dans la voix des cieux,
Ils s'en vont adorer leur Dieu;
Et Jésus, en échange,
Leur donne le bonheur.

Ô nuit de paix! Sainte nuit!
Dans l'étable, aucun bruit:
Sur la paille est couché l'Enfant
Que la Vierge endort en chantant.
Il repose en ses langes,
Son Jésus ravissant.`,
    composer: "Franz Xaver Gruber / Joseph Mohr",
    year: 1818,
    tags: ["noël", "paix", "nativité"],
    language: "fr"
  },
  {
    title: "Debout, sainte cohorte",
    lyrics: `Debout, sainte cohorte,
Soldats du Roi des rois!
Tenez d'une main forte
L'étendard de la croix.
Au sentier de la gloire
Jésus-Christ nous conduit;
De victoire en victoire
Il mène qui le suit.

La trompette résonne:
Debout, vaillants soldats!
L'Éternel vous ordonne
De livrer le combat.
Allez! que votre vie
Luise aux yeux des pécheurs,
Et que de la patrie
Vous soyez conquéreurs.

Debout pour la bataille!
Partez, n'hésitez plus!
Luttez, quoi qu'il advienne,
Forts du secours de Jésus.
En avant! la couronne
Est au bout du chemin;
Le Maître vous la donne
De sa puissante main.`,
    composer: "George Duffield / George J. Webb",
    year: 1858,
    tags: ["combat spirituel", "courage", "foi"],
    language: "fr"
  },
  {
    title: "Ô Père de grâce",
    lyrics: `Ô Père de grâce, en qui je me fie,
Mon Dieu, mon Sauveur, écoute ma prière;
Donne-moi ta paix, soutiens-moi dans la vie,
Que je reste toujours dans ta lumière.

Ta bonté m'entoure, ta main me protège,
Tes yeux veillent sur moi dans la nuit sombre;
Tu es mon refuge, mon ferme rempart,
Tu dissipes en moi les doutes et l'ombre.

Conduis-moi, Seigneur, sur le bon chemin,
Que jamais je ne m'écarte de ta voie;
Tiens-moi par la main jusqu'au jour sans fin,
Et que mon coeur toujours en toi soit plein de joie.`,
    composer: "Traditionnel",
    year: null,
    tags: ["prière", "protection", "foi"],
    language: "fr"
  },
  {
    title: "Gloire à Dieu dans les cieux",
    lyrics: `Gloire à Dieu dans les cieux
Et sur la terre, paix!
Chantons le Roi glorieux,
Adorons-le à jamais!

Il est notre Créateur,
Notre Père céleste;
Son amour est le meilleur,
Sa grâce manifeste.

Gloire au Christ, Fils de Dieu,
Qui vint pour nous sauver!
Il est le chemin, le lieu
Où l'on peut se trouver.

Gloire à l'Esprit divin,
Consolateur fidèle!
Il nous guide jusqu'à la fin,
Sa présence éternelle.`,
    composer: "Traditionnel",
    year: null,
    tags: ["louange", "gloire", "trinité"],
    language: "fr"
  }
];

export async function seedFrenchHymns() {
  if (seeded) return;
  
  try {
    const existing = await db.select().from(hymns).where(eq(hymns.language, "fr")).limit(1);
    if (existing.length > 0) {
      console.log("French hymns already seeded, skipping...");
      seeded = true;
      return;
    }

    console.log("Seeding French hymns...");
    
    for (const hymn of FRENCH_HYMNS) {
      await db.insert(hymns).values({
        title: hymn.title,
        lyrics: hymn.lyrics,
        composer: hymn.composer,
        year: hymn.year,
        tags: hymn.tags,
        tune: null,
        meter: null,
        language: hymn.language,
      });
    }
    
    console.log(`Seeded ${FRENCH_HYMNS.length} French hymns`);
    seeded = true;
  } catch (error) {
    console.error("Error seeding French hymns:", error);
  }
}
