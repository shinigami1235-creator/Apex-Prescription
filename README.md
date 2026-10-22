# Apex SX Skin: product page redesign

This folder holds five new layouts for the All Products page on apexsxskin.com (https://www.apexsxskin.com/product/). Only the product section changes; the header, footer, menu, search and cart come from the live page as it was on 22 October 2026. Open `index.html` in Chrome to see all five versions and the current page side by side.

## What's in each version

| Folder | Layout |
|---|---|
| `v1-category-ring` | Category chips over a Blender ring platform. The ring turns every 6 seconds, and dragging or tapping a product brings it to the front with its details beside it. |
| `v2-routine-shelf` | Six concerns (Acne, Dark spots, Anti-aging, Dry skin, Body, Hair loss). Each one fills four Blender steps in order of use, with the routine total and one button that adds all four. |
| `v3-scroll-spotlight` | One product per category takes the Blender plinth in turn as you scroll. |
| `v4-skin-map` | The MakeHuman mesh figure from the Apex Surgery body map. Tapping an area lists the products whose "วิธีใช้" names that area. |
| `v5-ring-and-routine` | Seven featured products on the ring, the routine shelf, then every product. |
| `original` | The current page, saved with its styles for comparison. |

Every version ends with the full catalogue: all 28 products with category, price and sort filters, the same as the live page but without the second page.

## Where the content comes from

- Product names, prices, categories and links come from WooCommerce's Store API (`/wp-json/wc/store/v1/products`). The Thai text (short description, รายละเอียด, ส่วนผสมสำคัญ, วิธีใช้, อย. number) is copied word for word from each product page.
- Product images are Apex's official packshots (Google Drive folder APEX-SX_Live_PackShot) for 25 products. Double Cleanser, Clear Toner and Revitalizer Cleanser aren't in that folder, so theirs are cut out of the product page photo. The folder also has Enzyme Bright Serum, Elixir Mask, BX UV Soft and Moist Tank Cream, which aren't in the shop yet. The gallery posters in the product drawer are the site's own gallery images.
- The stage backgrounds (ring, shelf, plinth) are Blender renders. `project/renders/blend` has the scenes, and `project/tools/stages.py` rebuilds them (`python stages.py ring wide 64 out_folder`). Each render also writes a JSON file with the screen position of every standing spot, so the page can put products on the surfaces.

These are my picks, not Apex's, and need their OK before launch:
- the seven featured products in version 5
- the six routines and their steps in versions 2 and 5
- which products show for each body area in version 4

## For Apex's IT (moving it into WordPress)

The new section is plain HTML, CSS and JavaScript with no build step:

- `assets/css/apex-shop.css`: all styles, scoped under `.ax` so Elementor's styles aren't touched
- `assets/js/products.js`: product data. On WordPress this should be printed by PHP from WooCommerce so price changes show up by themselves.
- `assets/js/apex-shop.js`: catalogue, product drawer, cart, ring engine
- `assets/js/v/*.js`: one file per version, plus `parts.js` shared by versions 1, 2 and 5
- `assets/stage`: stage renders and their spot data
- `assets/img/p`: product cutouts, `assets/img/g`: gallery posters

To install, replace the Elementor loop grid and filters on page 38 (All Products) with an HTML widget or page template that outputs `<div class="ax" id="ax-root"></div>` and loads the files above. The cart in the preview only lives in the browser. On the live site, `Cart.add` and `Cart.addMany` in `apex-shop.js` should call WooCommerce's `?wc-ajax=add_to_cart` and refresh the header cart fragments instead.

## Problems on the live product pages

These are on the live site now and were copied as they are:

1. Body Focus Cream: its วิธีใช้ is the hair conditioner instruction ("หลังสระด้วยแชมพู ใช้ครีมนวดชโลมไปที่เส้นผม...").
2. Clear Toner has no price, and its อย. number shows only "1400".
3. Double Cleanser: the ส่วนผสมสำคัญ section repeats the short description instead of listing ingredients.
4. Gluta-O has no วิธีใช้ section (the dose is only in the short description), and Revitalizer Cleanser has no รายละเอียด or ส่วนผสมสำคัญ.
5. All 28 product pages list the contact number as (+62) 8152 254 239. +62 is Indonesia's country code; Thailand's is +66.

## Rebuilding

The tools run on Python 3 with Pillow, BeautifulSoup and rembg; `stages.py` needs Blender's `bpy` module.

1. `project/tools/parse.py`: product pages to `project/data/products.json`
2. `project/tools/cutout.py`: product photos to cutouts
3. `project/tools/stages.py`: Blender stages
4. `project/tools/build_assets.py`: data, cutouts and posters to `assets`
5. `project/tools/build_pages.py`: wraps each version in the live header and footer
