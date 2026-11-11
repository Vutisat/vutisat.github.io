/* ---------------------------------------------------------------------------
   Recipes from Home — the data behind recipes.html

   SAMPLE RECIPES. These are generic, everyday versions of common Thai
   dishes, written as placeholders. Swap in the real (family) versions and
   the shelf and the recipe labels redraw themselves.

   Each recipe:
     id       short slug, used for the link (#id)
     th       name in Thai
     en       name in English
     colour   label ground: "red" | "green" | "gold" | "blue" | "black"
     serves   how many
     time     e.g. "20 min"
     heat     0 to 3 chillies
     gather   ingredients, one per line
     prepare  steps before the heat goes on
     cook     steps at the stove
     serve    how it reaches the table
     note     one line, optional
     photo    optional: a square picture of the dish (assets/img/recipes/dishes/)
     alt      what the photo shows
     credit   { by, licence, source, licenceUrl } — every photo is credited
              in the footer; the current ones are from Wikimedia Commons

   Every recipe goes through the same four stages, so they read alike.
   Once these are real, set window.RECIPES_ARE_REAL = true to remove the
   "sample" note.
--------------------------------------------------------------------------- */
window.RECIPES = [
  { id: "kra-pao", th: "ผัดกะเพรา", en: "Holy basil stir-fry", colour: "red",
    serves: 2, time: "15 min", heat: 3,
    photo: "assets/img/recipes/dishes/kra-pao.webp", alt: "Minced meat stir-fried with holy basil, with a fried egg and rice",
    credit: { by: "Asturio Cantabrio", licence: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Siam_Garden_Phat_kaphrao_ac.jpg", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
    gather: ["300 g minced pork or chicken", "4 cloves garlic", "3 to 6 bird's eye chillies", "1 big handful holy basil leaves",
             "1 tbsp oyster sauce", "1 tsp soy sauce", "1 tsp fish sauce", "1 tsp sugar", "2 eggs, for frying", "Jasmine rice, to serve"],
    prepare: ["Pound the garlic and chillies to a rough paste.", "Pick the basil leaves off their stems.", "Mix the sauces and sugar in a cup."],
    cook: ["Fry the eggs in plenty of hot oil until the edges crisp. Set aside.", "Fry the paste in a little oil for 20 seconds.",
           "Add the meat, break it up, cook until no longer pink.", "Pour in the sauce, toss, then throw in the basil and take it off the heat."],
    serve: ["Over rice, egg on top.", "Fish sauce with sliced chillies on the side."],
    note: "Sample note: the one-plate lunch everyone orders when they can't decide." },
  { id: "larb", th: "ลาบหมู", en: "Spicy minced pork salad", colour: "green",
    serves: 2, time: "20 min", heat: 2,
    photo: "assets/img/recipes/dishes/larb.webp", alt: "Larb moo heaped on lettuce leaves",
    credit: { by: "Haydn Blackey from Cardiff, Wales", licence: "CC BY-SA 2.0", source: "https://commons.wikimedia.org/wiki/File:Larb_Moo_-_Siam_Thai_Restaurant_-_Regina_(30194553768).jpg", licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0/" },
    gather: ["300 g minced pork", "3 tbsp water or stock", "2 tbsp uncooked sticky rice, for toasted rice powder", "3 shallots, thinly sliced",
             "1 to 2 tsp dried chilli flakes", "2 tbsp fish sauce", "2 to 3 tbsp lime juice", "1 pinch sugar",
             "2 spring onions, sliced", "1 handful mint leaves", "1 handful coriander, chopped", "Sticky rice, cabbage, long beans and cucumber, to serve"],
    prepare: ["Toast the sticky rice in a dry pan, stirring, until deep golden. Grind it to a coarse powder.",
              "Slice the shallots and spring onions; pick the mint leaves."],
    cook: ["Put the pork and water in a pan over medium heat, with no oil. Break it up and cook until just done.",
           "Off the heat, season with fish sauce, lime juice, sugar and chilli flakes.",
           "Stir in the toasted rice powder, then fold through the shallots and herbs."],
    serve: ["Warm, not hot, with sticky rice.", "Raw cabbage, long beans and cucumber alongside to cool it down."],
    note: "Sample note: the toasted rice is the whole point. Make it fresh; the jar kind tastes of nothing." },
  { id: "khai-jiao", th: "ไข่เจียว", en: "Puffy Thai omelette", colour: "gold",
    serves: 1, time: "5 min", heat: 0,
    photo: "assets/img/recipes/dishes/khai-jiao.webp", alt: "A puffy golden Thai omelette over rice",
    credit: { by: "Bitterschoko", licence: "CC0", source: "https://commons.wikimedia.org/wiki/File:Khao_khaichiao_(omelette_with_rice),_Bangkok,_2018-05-15.jpg", licenceUrl: "https://creativecommons.org/publicdomain/zero/1.0/" },
    gather: ["3 eggs", "1 tsp fish sauce", "1 tsp lime juice", "Neutral oil, about 1 cup", "Jasmine rice, to serve", "Sriracha, to serve"],
    prepare: ["Beat the eggs hard with the fish sauce and lime juice until frothy."],
    cook: ["Heat the oil in a wok until it shimmers.", "Pour the eggs in from a height so they puff.", "Flip once when golden underneath."],
    serve: ["Drained, on rice, with sriracha."],
    note: "Sample note: the dinner for when there's nothing in the fridge." },
  { id: "som-tam", th: "ส้มตำ", en: "Green papaya salad", colour: "blue",
    serves: 2, time: "15 min", heat: 2,
    photo: "assets/img/recipes/dishes/som-tam.webp", alt: "Green papaya salad with tomato and long beans on a plate",
    credit: { by: "T.Tseng", licence: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:Som_Tum_%E0%B8%AA%E0%B9%89%E0%B8%A1%E0%B8%95%E0%B8%B3%E0%B9%84%E0%B8%97%E0%B8%A2-_mortar_pounded_green_papaya_salad_with_palm_sugar,_lime_juice,_bird_eye_chile,_peanuts.jpg", licenceUrl: "https://creativecommons.org/licenses/by/2.0/" },
    gather: ["2 cups shredded green papaya", "2 cloves garlic", "2 to 4 bird's eye chillies", "1 tbsp palm sugar", "2 tbsp fish sauce",
             "2 tbsp lime juice", "6 cherry tomatoes, halved", "2 long beans, cut", "2 tbsp roasted peanuts"],
    prepare: ["Shred the papaya into long thin strips.", "Cut the long beans into short lengths."],
    cook: ["Pound the garlic and chillies in a mortar.", "Add the palm sugar, fish sauce and lime juice; pound to dissolve.",
           "Add the beans and tomatoes and bruise them lightly.", "Add the papaya and toss with a spoon while pounding gently."],
    serve: ["Topped with peanuts.", "With sticky rice and grilled chicken."],
    note: "Sample note: taste and adjust. It should be sour, salty, sweet and hot all at once." },
  { id: "moo-kratiem", th: "หมูกระเทียมพริกไทย", en: "Garlic pepper pork", colour: "black",
    serves: 2, time: "25 min", heat: 0,
    photo: "assets/img/recipes/dishes/moo-kratiem.webp", alt: "Fried garlic pork in a white bowl",
    credit: { by: "Takeaway", licence: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Mu_thot_krathiam.jpg", licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/" },
    gather: ["300 g pork loin or shoulder, thinly sliced", "1 whole head garlic", "2 coriander roots (or a few stems)", "1 tsp white peppercorns",
             "1 tbsp oyster sauce", "1 tbsp light soy sauce", "1 tsp fish sauce", "1 tsp sugar", "3 tbsp neutral oil",
             "Jasmine rice, cucumber slices and a fried egg, to serve"],
    prepare: ["Pound the coriander root and peppercorns, then add half the garlic and pound to a rough paste. Chop the rest of the garlic.",
              "Mix the paste into the pork with the oyster sauce, soy sauce, fish sauce and sugar. Leave 15 minutes."],
    cook: ["Fry the chopped garlic in the oil over medium heat until pale gold. Lift it out to drain; keep the oil.",
           "Turn the heat up. Add the pork in one layer and leave it to brown before tossing.",
           "Cook until caramelised at the edges, adding a splash of water if the pan catches."],
    serve: ["On rice, the crisp garlic scattered over.", "Cucumber slices and a fried egg on the side."],
    note: "Sample note: be generous with the white pepper. It is the heat here, not chillies." },
  { id: "khao-pad-goong", th: "ข้าวผัดกุ้ง", en: "Shrimp fried rice", colour: "red",
    serves: 2, time: "15 min", heat: 0,
    photo: "assets/img/recipes/dishes/khao-pad-goong.webp", alt: "Shrimp fried rice with a lime wedge, cucumber and chilli sauce",
    credit: { by: "PattayaPatrol", licence: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:DFC_5103_Shrimp_fried_rice_served_with_lime_sliced_cucumber_and_a_side_of_spicy_chili_sauce_-_a_classic_Thai_comfort_dish_from_Pattaya.jpg", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
    gather: ["2 cups cooked jasmine rice, a day old", "10 to 12 shrimp, peeled and deveined", "2 eggs", "3 cloves garlic, chopped",
             "1/2 onion, sliced", "1 tomato, cut into wedges", "1 tbsp light soy sauce", "1 tsp fish sauce", "1/2 tsp sugar",
             "White pepper", "2 spring onions, sliced", "Lime wedges, cucumber and prik nam pla, to serve"],
    prepare: ["Break up any clumps of rice with your hands.", "Mix the soy sauce, fish sauce and sugar in a cup."],
    cook: ["Fry the garlic in a little oil until fragrant, add the shrimp and cook until just pink. Lift them out.",
           "Crack in the eggs and scramble until nearly set.",
           "Add the onion and rice; toss over high heat until the rice is hot and separate.",
           "Pour in the sauce, return the shrimp, add the tomato and spring onion, and finish with white pepper."],
    serve: ["With a lime wedge to squeeze over and cucumber on the side.", "Prik nam pla (fish sauce with sliced chillies) for anyone who wants heat."],
    note: "Sample note: fresh rice turns to mush. Cook it the day before." },
  { id: "khanom-pang-na-moo", th: "ขนมปังหน้าหมู", en: "Fried pork toast", colour: "gold",
    serves: 4, time: "35 min", heat: 0,
    gather: ["6 slices white bread, a day old", "200 g minced pork", "1 egg", "2 cloves garlic", "2 coriander roots",
             "1/4 tsp white pepper", "1 tsp fish sauce", "1 tsp light soy sauce", "1/2 tsp sugar", "White sesame seeds and coriander leaves",
             "Oil for deep frying", "For the ajad: 1 cucumber, 1 shallot, 1 chilli, 4 tbsp vinegar, 3 tbsp sugar, 1 pinch salt"],
    prepare: ["Make the ajad: warm the vinegar, sugar and salt until dissolved; cool, then pour over the diced cucumber, sliced shallot and chilli.",
              "Pound the garlic, coriander root and pepper. Mix into the pork with the egg, fish sauce, soy sauce and sugar.",
              "Spread the pork thickly over each slice, right to the edges. Press sesame seeds and a coriander leaf on top; cut into triangles."],
    cook: ["Heat the oil to about 170°C.", "Fry pork side down for 2 to 3 minutes, until golden and cooked through.",
           "Flip for 30 seconds to crisp the bread, then drain on paper."],
    serve: ["Hot, with the ajad in a small bowl for spooning over.", "Good with sweet chilli sauce too."],
    note: "Sample note: spread the pork to the very edge, or the bread burns where it is bare." },
  { id: "mango-sticky-rice", th: "ข้าวเหนียวมะม่วง", en: "Mango sticky rice", colour: "black",
    serves: 4, time: "1 hr + soaking", heat: 0,
    photo: "assets/img/recipes/dishes/mango-sticky-rice.webp", alt: "Sliced ripe mango beside sweet sticky rice",
    credit: { by: "Dennis Wong from Hong Kong, Hong Kong", licence: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:Mango_sticy_rice_(3859549574).jpg", licenceUrl: "https://creativecommons.org/licenses/by/2.0/" },
    gather: ["300 g glutinous rice, soaked overnight", "250 ml coconut milk", "60 g sugar", "1/2 tsp salt", "2 ripe mangoes",
             "Toasted mung beans or sesame, to finish"],
    prepare: ["Drain the soaked rice.", "Warm 200 ml coconut milk with the sugar and salt until dissolved."],
    cook: ["Steam the rice for about 25 minutes, until tender.", "Stir the hot rice into the sweet coconut milk and leave it to soak up for 20 minutes.",
           "Simmer the last 50 ml coconut milk with a pinch of salt for the topping."],
    serve: ["Rice beside sliced mango.", "Spoon the salty coconut over and scatter the mung beans."],
    note: "Sample note: the reason to wait for mango season." }
];

window.RECIPES_ARE_REAL = false;
