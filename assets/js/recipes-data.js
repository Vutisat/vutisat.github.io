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

   Every recipe goes through the same four stages, so they read alike.
   Once these are real, set window.RECIPES_ARE_REAL = true to remove the
   "sample" note.
--------------------------------------------------------------------------- */
window.RECIPES = [
  { id: "kra-pao", th: "ผัดกะเพรา", en: "Holy basil stir-fry", colour: "red",
    serves: 2, time: "15 min", heat: 3,
    gather: ["300 g minced pork or chicken", "4 cloves garlic", "3 to 6 bird's eye chillies", "1 big handful holy basil leaves",
             "1 tbsp oyster sauce", "1 tsp soy sauce", "1 tsp fish sauce", "1 tsp sugar", "2 eggs, for frying", "Jasmine rice, to serve"],
    prepare: ["Pound the garlic and chillies to a rough paste.", "Pick the basil leaves off their stems.", "Mix the sauces and sugar in a cup."],
    cook: ["Fry the eggs in plenty of hot oil until the edges crisp. Set aside.", "Fry the paste in a little oil for 20 seconds.",
           "Add the meat, break it up, cook until no longer pink.", "Pour in the sauce, toss, then throw in the basil and take it off the heat."],
    serve: ["Over rice, egg on top.", "Fish sauce with sliced chillies on the side."],
    note: "Sample note: the one-plate lunch everyone orders when they can't decide." },
  { id: "tom-kha", th: "ต้มข่าไก่", en: "Chicken & galangal coconut soup", colour: "green",
    serves: 3, time: "30 min", heat: 1,
    gather: ["400 ml coconut milk", "200 ml chicken stock", "300 g chicken thigh, sliced", "6 slices galangal", "2 stalks lemongrass",
             "4 makrut lime leaves", "150 g mushrooms", "2 tbsp fish sauce", "2 tbsp lime juice", "Coriander, to finish"],
    prepare: ["Bruise the lemongrass and cut into short lengths.", "Tear the lime leaves, removing the centre vein.", "Slice the mushrooms."],
    cook: ["Warm the coconut milk and stock with the galangal, lemongrass and lime leaves.", "Add the chicken and simmer gently until cooked.",
           "Add the mushrooms for two minutes more.", "Off the heat, season with fish sauce and lime juice."],
    serve: ["In bowls with coriander on top.", "With rice on the side."],
    note: "Sample note: never let it boil hard, or the coconut milk splits." },
  { id: "khai-jiao", th: "ไข่เจียว", en: "Puffy Thai omelette", colour: "gold",
    serves: 1, time: "5 min", heat: 0,
    gather: ["3 eggs", "1 tsp fish sauce", "1 tsp lime juice", "Neutral oil, about 1 cup", "Jasmine rice, to serve", "Sriracha, to serve"],
    prepare: ["Beat the eggs hard with the fish sauce and lime juice until frothy."],
    cook: ["Heat the oil in a wok until it shimmers.", "Pour the eggs in from a height so they puff.", "Flip once when golden underneath."],
    serve: ["Drained, on rice, with sriracha."],
    note: "Sample note: the dinner for when there's nothing in the fridge." },
  { id: "som-tam", th: "ส้มตำ", en: "Green papaya salad", colour: "blue",
    serves: 2, time: "15 min", heat: 2,
    gather: ["2 cups shredded green papaya", "2 cloves garlic", "2 to 4 bird's eye chillies", "1 tbsp palm sugar", "2 tbsp fish sauce",
             "2 tbsp lime juice", "6 cherry tomatoes, halved", "2 long beans, cut", "2 tbsp roasted peanuts"],
    prepare: ["Shred the papaya into long thin strips.", "Cut the long beans into short lengths."],
    cook: ["Pound the garlic and chillies in a mortar.", "Add the palm sugar, fish sauce and lime juice; pound to dissolve.",
           "Add the beans and tomatoes and bruise them lightly.", "Add the papaya and toss with a spoon while pounding gently."],
    serve: ["Topped with peanuts.", "With sticky rice and grilled chicken."],
    note: "Sample note: taste and adjust. It should be sour, salty, sweet and hot all at once." },
  { id: "mango-sticky-rice", th: "ข้าวเหนียวมะม่วง", en: "Mango sticky rice", colour: "black",
    serves: 4, time: "1 hr + soaking", heat: 0,
    gather: ["300 g glutinous rice, soaked overnight", "250 ml coconut milk", "60 g sugar", "1/2 tsp salt", "2 ripe mangoes",
             "Toasted mung beans or sesame, to finish"],
    prepare: ["Drain the soaked rice.", "Warm 200 ml coconut milk with the sugar and salt until dissolved."],
    cook: ["Steam the rice for about 25 minutes, until tender.", "Stir the hot rice into the sweet coconut milk and leave it to soak up for 20 minutes.",
           "Simmer the last 50 ml coconut milk with a pinch of salt for the topping."],
    serve: ["Rice beside sliced mango.", "Spoon the salty coconut over and scatter the mung beans."],
    note: "Sample note: the reason to wait for mango season." }
];

window.RECIPES_ARE_REAL = false;
