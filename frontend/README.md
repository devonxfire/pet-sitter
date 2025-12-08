# Frontend quick tasks

This file documents the small workflow to create a transparent hero image so it blends seamlessly with the site background.

Prerequisites
- macOS with Homebrew (or your platform's package manager)
- ImageMagick (`magick`) installed

Install ImageMagick (macOS):

```bash
brew install imagemagick
```

Generate a transparent hero image

1. Place your hero PNG at `frontend/public/hero-pets.png`.
2. From the `frontend` folder run the script that attempts to remove a near-white background:

```bash
./scripts/remove-hero-bg.sh --fuzz 12% --color "#f6f6f6"
```

Adjust the `--fuzz` percentage (try 8% → 30%) or `--color` hex to tune the result.

What the script does
- Produces `frontend/public/hero-pets-transparent.png` from `hero-pets.png`.
- The app will prefer `hero-pets-transparent.png` automatically if present; otherwise it will use `hero-pets.png`.

If the automated removal does not look clean, consider using a manual background removal service (remove.bg) or an image editor for the best result.
