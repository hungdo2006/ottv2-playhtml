# Piece assets

The game uses six fixed SVG files: three blue pieces for P1 and three red pieces for P2.

## P1 - Blue

- `bluerock.svg`
- `bluepaper.svg`
- `bluescissors.svg`

## P2 - Red

- `redrock.svg`
- `redpaper.svg`
- `redscissors.svg`

To change the artwork later, replace the contents of these six files and keep the filenames and paths exactly the same. No JavaScript or CSS changes are needed.

Recommended artwork:
- SVG with a square `viewBox`
- transparent background
- centered subject
- minimal empty padding
- readable at small board sizes

The mapping lives in `js/constants.js`.
