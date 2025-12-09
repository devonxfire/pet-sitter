Place licensed Nohemi WOFF/WOFF2 files here with the names the project expects.

Recommended filenames (these match the @font-face rules in `src/index.css`):
- Nohemi-Regular.woff2
- Nohemi-Regular.woff
- Nohemi-Medium.woff2
- Nohemi-Medium.woff
- Nohemi-Bold.woff2
- Nohemi-Bold.woff
- Nohemi-ExtraBold.woff2
- Nohemi-ExtraBold.woff

Quick copy example (macOS/zsh):

# from your Downloads folder
cp ~/Downloads/Nohemi-* ~/"Audioshelf Dropbox"/Devon\ Martindale/WebDev/pet-sitter/frontend/public/fonts/

Verify files and types:

file frontend/public/fonts/Nohemi-Medium.woff2
ls -l frontend/public/fonts

If the browser still logs `OTS parsing error: invalid sfntVersion` after placing valid files, try:
- Confirm file size is > 1 KB (small files are probably HTML error pages).
- Open http://localhost:5173/fonts/Nohemi-Medium.woff2 in your browser to ensure it serves binary data (not a 404 HTML page).

If you'd like, paste the output of `ls -l frontend/public/fonts` here and I'll verify the files and update CSS if your file names differ.