/* ---------------------------------------------------------------------------
   Concerts & Shows — the data behind concerts.html

   SAMPLE DATA. Every artist below is invented, so nothing here can be
   mistaken for a real night out. Replace the entries with the real ones and
   the page redraws itself: newest year first, newest show first in a year.

   Each show:
     artist   who you saw (required)
     date     "YYYY-MM-DD" (required; "YYYY-MM" or "YYYY" also work)
     venue    where
     city     which city
     kind     "concert" | "festival" | "show" | "comedy"   (the label on the band)
     band     "woven" | "paper" | "silicone"   (what the wristband was made of)
     color    any CSS colour for the band
     with     who you went with (optional)
     support  the opening act (optional)
     note     one or two sentences about the night (optional)

   WISHLIST is the drawer's empty corner: shows you still want to see.

   Once the list is real, set window.CONCERTS_ARE_REAL = true (below) and
   the "sample" note on the page disappears.
--------------------------------------------------------------------------- */
window.CONCERTS = [
  { artist: "The Paper Lanterns", date: "2025-09-20", venue: "Forest Hills Stadium", city: "New York",
    kind: "concert", band: "woven", color: "#E4572E", with: "Sample friend",
    support: "Glasshouse Choir", note: "Sample note: the encore went on long enough that the trains stopped running. Worth the walk." },
  { artist: "Moonhouse", date: "2025-06-07", venue: "Brooklyn Steel", city: "New York",
    kind: "concert", band: "paper", color: "#F3F0E8",
    note: "Sample note: a small room, a loud band, ears ringing the whole way home." },
  { artist: "Saltwater Choir", date: "2025-03-14", venue: "Radio City Music Hall", city: "New York",
    kind: "show", band: "silicone", color: "#2E86AB",
    note: "Sample note: the kind of hall where you look up at the ceiling more than the stage." },
  { artist: "Northern Lights Weekend", date: "2024-08-10", venue: "Fort Point", city: "Reykjavík",
    kind: "festival", band: "woven", color: "#7B5EA7", with: "Sample friends",
    note: "Sample note: three days, two raincoats, one sunset that lasted until midnight." },
  { artist: "Late Set at the Cellar", date: "2024-05-22", venue: "Comedy Cellar", city: "New York",
    kind: "comedy", band: "paper", color: "#F7D046",
    note: "Sample note: six comedians, one surprise drop-in, and a very small table." },
  { artist: "Velvet Static", date: "2024-02-02", venue: "Beacon Theatre", city: "New York",
    kind: "concert", band: "woven", color: "#C2185B", support: "The Quiet Hours",
    note: "Sample note: they played the whole first album front to back." },
  { artist: "Bangkok Night Sessions", date: "2023-12-29", venue: "Lido Connect", city: "Bangkok",
    kind: "concert", band: "silicone", color: "#3BB273", with: "Sample family",
    note: "Sample note: a homecoming show, the whole room singing along in Thai." },
  { artist: "Harbour Lights Festival", date: "2023-07-15", venue: "Marina Bay", city: "Singapore",
    kind: "festival", band: "woven", color: "#F29E4C",
    note: "Sample note: humid, loud and late. The best kind of festival." }
];

window.WISHLIST = [
  "A band I keep missing",
  "A festival on the list",
  "The comeback tour",
  "A show in another country"
];

window.CONCERTS_ARE_REAL = false;
