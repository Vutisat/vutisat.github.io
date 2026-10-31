/* ---------------------------------------------------------------------------
   Uses — the data behind uses.html

   SAMPLE ITEMS. These are generic placeholders, not the real kit. Replace
   them and the pegboard rehangs itself.

   Each zone is a painted area of the board:
     name     the label-tape name
     colour   the paint: "blue" | "red" | "yellow" | "green"
     wide     true to give the zone two columns
     items    what hangs there

   Each item:
     name     on the label tape
     shape    the silhouette painted behind it:
              laptop monitor keyboard mouse headphones lamp mug kettle grinder
              notebook pen backpack phone editor terminal notes calendar
     note     why it's there (shown when you pick it off the board)
     out      true if it's off the board right now (only its outline shows)

   Once these are real, set window.USES_ARE_REAL = true to remove the
   "sample" note.
--------------------------------------------------------------------------- */
window.USES = [
  { name: "At the desk", colour: "blue", wide: true, items: [
    { name: "Laptop", shape: "laptop", note: "Sample: the work machine. Fast enough that the build is never the excuse." },
    { name: "Monitor", shape: "monitor", note: "Sample: one big screen beats two small ones, and the neck agrees." },
    { name: "Keyboard", shape: "keyboard", note: "Sample: low-profile mechanical, quiet enough for calls." },
    { name: "Mouse", shape: "mouse", note: "Sample: the one with the scroll wheel that spins forever." },
    { name: "Headphones", shape: "headphones", out: true, note: "Sample: out right now, on someone's head in a meeting." },
    { name: "Desk lamp", shape: "lamp", note: "Sample: warm light after six, so the room feels like home again." }
  ]},
  { name: "On the screen", colour: "red", items: [
    { name: "Code editor", shape: "editor", note: "Sample: where most of the day happens." },
    { name: "Terminal", shape: "terminal", note: "Sample: a split pane and a long scrollback." },
    { name: "Notes", shape: "notes", note: "Sample: one plain-text file per day, searchable forever." },
    { name: "Calendar", shape: "calendar", note: "Sample: blocks of focus time, defended." }
  ]},
  { name: "In the bag", colour: "yellow", items: [
    { name: "Backpack", shape: "backpack", note: "Sample: one bag that has been to most of the 80 countries." },
    { name: "Notebook", shape: "notebook", note: "Sample: paper for thinking, the laptop for doing." },
    { name: "Pen", shape: "pen", note: "Sample: the cheap one that never runs out." },
    { name: "Phone", shape: "phone", note: "Sample: maps, boarding passes, and too many photos of food." }
  ]},
  { name: "The coffee corner", colour: "green", items: [
    { name: "Kettle", shape: "kettle", note: "Sample: gooseneck, for a slow pour." },
    { name: "Grinder", shape: "grinder", note: "Sample: hand grinder, the morning's first two minutes of quiet." },
    { name: "Mug", shape: "mug", note: "Sample: the one that's always in the dishwasher when you want it." }
  ]}
];

window.USES_ARE_REAL = false;
