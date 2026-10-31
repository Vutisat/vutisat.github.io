# home.html cover colours

The intro "cover" on `home.html` is one dyed length of twill. Its colour lives in two
tokens at the top of `assets/css/swatch.css`:

```css
--cover:#B3C4F2;                     /* the dye, before the weave multiplies it down */
--cover-wash:rgba(236,240,255,.24);  /* a pale layer over the weave; transparent for darker dyes */
```

To switch, change those two values. Dyes are set brighter than they look on screen,
because the twill raster is multiplied over them and darkens them a lot.

## The portrait it has to sit behind

Midnight-navy tuxedo, cream shirt, warm skin, dark hair, on a sage-green wall.
The dominant dark is navy, so its complement (the warm yellow-orange family) makes
the suit stand out and flatters the skin.

## Options tried (October 2026)

| Colour | `--cover` | `--cover-wash` | Notes |
|---|---|---|---|
| Marigold | `#FFA62B` | `rgba(255,226,180,.22)` | Navy and gold: the suit stands out sharply and the skin reads warm. A nod to Thai marigold garlands. Deeper and warmer than the NYC swatch's mustard `#F2B63C`, so the two read as different dyes. |
| Apricot / terracotta | `#E39A6C` | `transparent` | Close second. Very flattering on skin, still complements navy, softer and friendlier. Sits near the Uses swatch's coral `#EE957F`. |
| Light lime | `#D9F36C` | `rgba(246,255,214,.34)` | Fresh, high contrast with the suit, but in the same green family as the sage wall, so the cover blends into the room; yellow-green beside skin can look sallow. Needs the wash or it turns olive. |
| Petrol (the original) | `#3F8F9C` | `transparent` | Calm and very "wool sample book", but navy on mid-dark teal is low contrast; the suit's edges sink into the cloth. Same dye as the Engineering tab. |
| **Periwinkle** (current) | `#B3C4F2` | `rgba(236,240,255,.24)` | Same blue family as the suit: harmonious and calm; the light tint keeps enough contrast for the navy suit to stand out. `#9FB3D9` without a wash is the flat preview value; it renders darker on the weave. |
| Camel | `#D9B48A` | `transparent` | Elegant with a tux, but beige on sage is muted; the cover stops being the focal point. |

With the real weave, `#F5A524` alone rendered ochre-brown and `#FFBE2E` read as mustard; the current
value plus a warm wash is the one that looks like marigold. Without the wash, light dyes come out much darker than their hex suggests: lime
`#CDE27C` and `#E6F79A` both rendered olive/moss.
