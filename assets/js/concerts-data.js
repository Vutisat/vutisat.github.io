/* ---------------------------------------------------------------------------
   Concerts & Shows — the data behind concerts.html

   Source of truth is the Google Sheet "Pob's Shows & Events"; this file is the
   copy that ships with the page, so it renders offline and on first paint.
   concerts.js re-reads the sheet after first paint and quietly swaps in any
   newer list. Built from ticket confirmations in Gmail (Oct 2026); a row only
   appears here when its "Show" column is Yes.

   Sheet columns (found by header, so they can be reordered):
     Event, Date ("YYYY-MM-DD", "YYYY-MM" or "YYYY"), Venue, City,
     Kind (concert | festival | theatre | comedy | talk | tech | show | exhibition | sports),
     Band (woven | paper | silicone), Color, With, Support, Note,
     Show (Yes / No), Check (to-do for Pob, never shown), Source

   To refresh this copy by hand:
     curl -sSL "https://docs.google.com/spreadsheets/d/14BQMP8DCWkiUpEehZkZSuVU4SBrxPc0LYUj8qj2Vxlk/gviz/tq?tqx=out:csv" -o shows.csv
--------------------------------------------------------------------------- */
window.CONCERTS_SHEET = "https://docs.google.com/spreadsheets/d/14BQMP8DCWkiUpEehZkZSuVU4SBrxPc0LYUj8qj2Vxlk/gviz/tq?tqx=out:csv";

window.CONCERTS = [
  { artist: "International Champions Cup: AC Milan v. Chelsea", date: "2016-08-03", venue: "U.S. Bank Stadium", city: "Minneapolis", kind: "sports", band: "silicone", color: "#2A9D8F" },
  { artist: "alt-J", date: "2017", kind: "concert", band: "woven", color: "#E4572E" },
  { artist: "Minnedemo27", date: "2017", city: "Minneapolis", kind: "tech", band: "silicone", color: "#3D5A80" },
  { artist: "Kendrick Lamar: The DAMN. Tour, with YG & D.R.A.M.", date: "2017-08", kind: "concert", band: "woven", color: "#7B5EA7" },
  { artist: "Coldplay: A Head Full of Dreams Tour", date: "2017-09-23", venue: "CenturyLink Field", city: "Seattle", kind: "concert", band: "woven", color: "#C2185B" },
  { artist: "Linkin Park & Friends: Celebrate Life in Honor of Chester Bennington", date: "2017-10-27", venue: "Hollywood Bowl", city: "Los Angeles", kind: "concert", band: "woven", color: "#F29E4C" },
  { artist: "Sam Smith: The Thrill of It All Tour", date: "2018-08-14", venue: "Xcel Energy Center", city: "Saint Paul", kind: "concert", band: "woven", color: "#1F6F8B" },
  { artist: "Penn & Teller", date: "2018-09-04", venue: "Penn & Teller Theater, Rio", city: "Las Vegas", kind: "show", band: "paper", color: "#EE6C4D" },
  { artist: "Maroon 5: Red Pill Blues Tour", date: "2018-09-18", venue: "Xcel Energy Center", city: "Saint Paul", kind: "concert", band: "woven", color: "#D1495B" },
  { artist: "lovelytheband", date: "2019-04", kind: "concert", band: "woven", color: "#E4572E" },
  { artist: "Minnedemo32", date: "2019-07-18", venue: "Ordway Center", city: "Saint Paul", kind: "tech", band: "silicone", color: "#6C757D" },
  { artist: "Immersive Van Gogh", date: "2021-07-10", city: "New York", kind: "exhibition", band: "paper", color: "#F4A261" },
  { artist: "Global Citizen Live NYC", date: "2021-09-25", venue: "Great Lawn, Central Park", city: "New York", kind: "festival", band: "woven", color: "#F7D046" },
  { artist: "Chicago", date: "2021-10", venue: "Ambassador Theatre", city: "New York", kind: "theatre", band: "paper", color: "#8E2C48" },
  { artist: "Moulin Rouge! The Musical", date: "2022-01", venue: "Al Hirschfeld Theatre", city: "New York", kind: "theatre", band: "paper", color: "#B8860B" },
  { artist: "David Byrne's American Utopia", date: "2022-01", venue: "St. James Theatre", city: "New York", kind: "theatre", band: "paper", color: "#2F4858" },
  { artist: "Sacred Rites, with Ascendant Vierge", date: "2022-03-25", venue: "Le Bain", city: "New York", kind: "concert", band: "woven", color: "#2E86AB" },
  { artist: "Macbeth", date: "2022-04", venue: "Longacre Theatre", city: "New York", kind: "theatre", band: "paper", color: "#8E2C48" },
  { artist: "Blue Man Group", date: "2022-06", venue: "Astor Place Theatre", city: "New York", kind: "show", band: "paper", color: "#EE6C4D" },
  { artist: "Coldplay: Music of the Spheres World Tour", date: "2022-06-05", venue: "MetLife Stadium", city: "East Rutherford", kind: "concert", band: "woven", color: "#F29E4C" },
  { artist: "Fotografiska New York", date: "2022-07", venue: "Fotografiska", city: "New York", kind: "exhibition", band: "paper", color: "#F4A261" },
  { artist: "Aladdin", date: "2022-10-14", venue: "New Amsterdam Theatre", city: "New York", kind: "theatre", band: "paper", color: "#B8860B" },
  { artist: "The Play That Goes Wrong", date: "2022-11", venue: "New World Stages", city: "New York", kind: "theatre", band: "paper", color: "#2F4858" },
  { artist: "Jump Start", date: "2022-12", venue: "La MaMa Experimental Theatre Club", city: "New York", kind: "theatre", band: "paper", color: "#8E2C48" },
  { artist: "alt-J: 10th Anniversary of An Awesome Wave", date: "2023-03-13", kind: "concert", band: "woven", color: "#1F6F8B" },
  { artist: "Parade", date: "2023-04", venue: "Bernard B. Jacobs Theatre", city: "New York", kind: "theatre", band: "paper", color: "#B8860B" },
  { artist: "A Doll's House, with Jessica Chastain", date: "2023-06", venue: "Hudson Theatre", city: "New York", kind: "theatre", band: "paper", color: "#2F4858" },
  { artist: "The Sacrifice of Cassamba Becker", date: "2023-06", venue: "Rattlestick Theater", city: "New York", kind: "theatre", band: "paper", color: "#8E2C48" },
  { artist: "John Oliver & Seth Meyers", date: "2023-08", kind: "comedy", band: "paper", color: "#F7D046" },
  { artist: "How To New York", date: "2023-08-30", city: "New York", kind: "talk", band: "silicone", color: "#5B8E7D" },
  { artist: "Global Citizen Festival", date: "2023-09-23", venue: "Great Lawn, Central Park", city: "New York", kind: "festival", band: "woven", color: "#3BB273" },
  { artist: "WORD Presents Levy Rozman", date: "2023-10-24", kind: "talk", band: "silicone", color: "#9C6644" },
  { artist: "Shucked", date: "2024-01-10", venue: "Nederlander Theatre", city: "New York", kind: "theatre", band: "paper", color: "#B8860B" },
  { artist: "The Book of Mormon", date: "2024-01-30", venue: "Eugene O'Neill Theatre", city: "New York", kind: "theatre", band: "paper", color: "#2F4858" },
  { artist: "Kimberly Akimbo", date: "2024-02", venue: "Booth Theatre", city: "New York", kind: "theatre", band: "paper", color: "#8E2C48" },
  { artist: "Coldplay: Music of the Spheres World Tour", date: "2024-08-25", venue: "Ernst-Happel-Stadion", city: "Vienna", kind: "concert", band: "woven", color: "#D1495B" },
  { artist: "Lorde: Ultrasound", date: "2025-09", venue: "Madison Square Garden", city: "New York", kind: "concert", band: "woven", color: "#2E86AB" },
  { artist: "The Witcher 3: Wild Hunt in Concert", date: "2025-09-20", venue: "Kings Theatre", city: "Brooklyn", kind: "concert", band: "woven", color: "#7B5EA7" },
  { artist: "Global Citizen Festival", date: "2025-09-27", venue: "Great Lawn, Central Park", city: "New York", kind: "festival", band: "woven", color: "#F29E4C" },
  { artist: "Stand-up at Broadway Comedy Club", date: "2026-02", venue: "Broadway Comedy Club", city: "New York", kind: "comedy", band: "paper", color: "#FF8C42" },
  { artist: "Lewis Capaldi", date: "2026-04-16", venue: "Madison Square Garden", city: "New York", kind: "concert", band: "woven", color: "#3BB273" },
  { artist: "The Art Meetup: First Open Mic of the Summer", date: "2026-06-06", venue: "The Rose", city: "New York", kind: "show", band: "paper", color: "#EE6C4D" },
  { artist: "NYC Fourth of July Fireworks", date: "2026-07-04", city: "New York", kind: "festival", band: "woven", color: "#F7D046" },
  { artist: "Bomb Shelter Comedy", date: "2026-08", city: "New York", kind: "comedy", band: "paper", color: "#F7D046" },
  { artist: "Built for NYC: AI Hackathon", date: "2026-08", venue: "New York Public Library", city: "New York", kind: "tech", band: "silicone", color: "#3D5A80" },
  { artist: "Emily St. John Mandel book launch", date: "2026-09", city: "New York", kind: "talk", band: "silicone", color: "#5B8E7D" },
  { artist: "Levy Rozman: How to Win at Chess, Next Level", date: "2026-09", city: "New York", kind: "talk", band: "silicone", color: "#9C6644" }
];

/* the drawer's empty corner: shows still to see. Empty hides it. */
window.WISHLIST = [];

window.CONCERTS_ARE_REAL = true;
