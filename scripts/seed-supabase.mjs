/**
 * Seeds the live Supabase mac-store project with real product photos (WebP) +
 * Egyptian-market-realistic dummy rows (prices in EGP, July 2026 street/retail ranges).
 *
 * Always purges previous Storage objects + `images` rows, then uploads fresh
 * files under new IDs so browsers/CDN never keep stale placeholder bytes.
 *
 * Usage: node --env-file=.env scripts/seed-supabase.mjs
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);
const BUCKET = 'product-images';
const now = new Date().toISOString();

/** New IDs every seed run would also work; fixed v2 IDs replace the old img_* set. */
const IMAGE = {
  macbookCover: 'img_v2_macbook_pro_cover',
  macbookSide: 'img_v2_macbook_pro_side',
  ipadCover: 'img_v2_ipad_pro_cover',
  iphoneCover: 'img_v2_iphone_pro_cover',
  magicMouse: 'img_v2_magic_mouse',
  usbcCharger: 'img_v2_usbc_charger',
  magicKeyboard: 'img_v2_magic_keyboard',
};

async function fetchAsWebp(sourceUrl) {
  const response = await fetch(sourceUrl, {
    headers: { 'User-Agent': 'mac-store-seed/1.0' },
  });
  if (!response.ok) {
    throw new Error(`Failed to download ${sourceUrl}: ${response.status}`);
  }
  const input = Buffer.from(await response.arrayBuffer());
  return sharp(input)
    .rotate()
    .resize(1400, 1400, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
}

async function listAllStoragePaths() {
  const { data, error } = await supabase.storage.from(BUCKET).list('', { limit: 1000 });
  if (error) throw error;
  return (data ?? [])
    .filter((entry) => entry.name && !entry.name.endsWith('/'))
    .map((entry) => entry.name);
}

async function purgeOldImages() {
  console.log('Detaching image FKs from products/accessories...');
  const { error: productsClearError } = await supabase
    .from('products')
    .update({ cover_image_id: null, image_ids: [] })
    .neq('id', '');
  if (productsClearError) throw productsClearError;

  const { error: accessoriesClearError } = await supabase
    .from('accessories')
    .update({ cover_image_id: null, image_ids: [] })
    .neq('id', '');
  if (accessoriesClearError) throw accessoriesClearError;

  console.log('Deleting images table rows...');
  const { error: imagesDeleteError } = await supabase.from('images').delete().neq('id', '');
  if (imagesDeleteError) throw imagesDeleteError;

  const paths = await listAllStoragePaths();
  if (paths.length > 0) {
    console.log('Removing', paths.length, 'files from Storage bucket...');
    const { error: removeError } = await supabase.storage.from(BUCKET).remove(paths);
    if (removeError) throw removeError;
  } else {
    console.log('Storage bucket already empty.');
  }
}

async function uploadImage(id, filename, buffer) {
  const storagePath = `${id}.webp`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: 'image/webp',
    upsert: true,
    cacheControl: '3600',
  });
  if (uploadError) throw uploadError;

  const { error: insertError } = await supabase.from('images').upsert({
    id,
    filename,
    mime_type: 'image/webp',
    size: buffer.byteLength,
    storage_path: storagePath,
    created_at: now,
  });
  if (insertError) throw insertError;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return { id, storagePath, publicUrl: `${data.publicUrl}?v=${buffer.byteLength}` };
}

async function main() {
  console.log('Seeding mac-store on', url);
  await purgeOldImages();

  const imageDefs = [
    {
      id: IMAGE.macbookCover,
      filename: 'macbook-pro-14.webp',
      source:
        'https://images.unsplash.com/photo-1658400274389-e7dbedd89b67?auto=format&fit=crop&w=1400&q=80',
    },
    {
      id: IMAGE.macbookSide,
      filename: 'macbook-pro-14-side.webp',
      source:
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1400&q=80',
    },
    {
      id: IMAGE.ipadCover,
      filename: 'ipad-pro-11.webp',
      source:
        'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1400&q=80',
    },
    {
      id: IMAGE.iphoneCover,
      filename: 'iphone-16-pro.webp',
      source: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/IPhone_15_pro_max.jpg',
    },
    {
      id: IMAGE.magicMouse,
      filename: 'magic-mouse.webp',
      source:
        'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=1400&q=80',
    },
    {
      id: IMAGE.usbcCharger,
      filename: 'usbc-charger-20w.webp',
      source:
        'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1400&q=80',
    },
    {
      id: IMAGE.magicKeyboard,
      filename: 'magic-keyboard.webp',
      source:
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1400&q=80',
    },
  ];

  for (const def of imageDefs) {
    console.log('Downloading real photo for', def.filename, '...');
    const buffer = await fetchAsWebp(def.source);
    const uploaded = await uploadImage(def.id, def.filename, buffer);
    console.log('Uploaded', def.filename, '->', uploaded.publicUrl);
  }

  const { error: settingsError } = await supabase.from('app_settings').upsert({
    id: 'app',
    store_name: 'متجر ماك',
    store_description:
      'متجر أجهزة Apple مستعملة ومجددة في مصر — ماك بوك، آيباد، آيفون وإكسسوارات بأسعار السوق الحالي',
    contact_email: 'hello@mac-store.eg',
    currency: 'EGP',
    show_serial_number: false,
    default_admin_username: 'admin',
    updated_at: now,
  });
  if (settingsError) throw settingsError;

  const products = [
    {
      id: 'prd_sample_macbook_pro_14',
      serial_number: 'C02XK1EGMD6N',
      model: 'MacBook Pro 14" (M3 Pro, 2023)',
      category: 'macbook-pro',
      cpu: 'Apple M3 Pro',
      ram: 18,
      storage: 512,
      storage_type: 'SSD',
      battery_health: 94,
      cycle_count: 86,
      condition: 'excellent',
      price: 64500,
      cost_price: 55000,
      description:
        'ماك بوك برو 14 إنش بشريحة M3 Pro، حالة ممتازة، لوحة مفاتيح عربي/إنجليزي، شاحن أصلي. مناسب للمونتاج والبرمجة. السعر أقل من الجديد في السوق (M4/M5 يبدأ من حوالي 88–105 ألف جنيه).',
      specifications: {
        Year: '2023',
        Color: 'Space Black',
        Keyboard: 'Arabic / English',
        Warranty: 'شهر ضمان محل',
        Origin: 'مستورد — حالة Grade A',
      },
      purchase_date: '2026-05-12',
      inventory_date: now,
      internal_notes: 'تم فحص البطارية والشاشة — جاهز للبيع في فرع القاهرة',
      availability: 'available',
      cover_image_id: IMAGE.macbookCover,
      image_ids: [IMAGE.macbookCover, IMAGE.macbookSide],
      created_at: now,
      updated_at: now,
    },
    {
      id: 'prd_sample_ipad_pro_129',
      serial_number: 'H2WJQ9LCKPHF',
      model: 'iPad Pro 11" (M4, 2024)',
      category: 'ipad-pro',
      cpu: 'Apple M4',
      ram: 8,
      storage: 256,
      storage_type: 'SSD',
      battery_health: 100,
      cycle_count: 12,
      condition: 'like-new',
      price: 48500,
      cost_price: 41000,
      description:
        'آيباد برو 11 إنش M4، واي فاي فقط، كسر زيرو تقريباً. الجديد في المتاجر المعتمدة يبدأ من حوالي 65 ألف جنيه — هذا السعر للمستخدم بحالة شبه جديدة.',
      specifications: {
        Year: '2024',
        Color: 'Space Black',
        Connectivity: 'Wi-Fi',
        Pencil: 'يدعم Apple Pencil Pro',
        Warranty: 'أسبوعين فحص',
      },
      purchase_date: '2026-06-20',
      inventory_date: now,
      internal_notes: 'بدون قلم ولوحة مفاتيح — جهاز فقط',
      availability: 'available',
      cover_image_id: IMAGE.ipadCover,
      image_ids: [IMAGE.ipadCover],
      created_at: now,
      updated_at: now,
    },
    {
      id: 'prd_sample_iphone_15_pro',
      serial_number: 'F17XN8QK0D9L',
      model: 'iPhone 16 Pro 256GB',
      category: 'iphone',
      cpu: 'Apple A18 Pro',
      ram: 8,
      storage: 256,
      storage_type: 'SSD',
      battery_health: 97,
      cycle_count: 64,
      condition: 'excellent',
      price: 58900,
      cost_price: 51500,
      description:
        'آيفون 16 برو 256 جيجا، تيتانيوم صحراوي، بطارية 97%، شاشة وخلفية بدون خدوش ظاهرة. سعر الجديد في مصر حوالي 69–75 ألف جنيه (B.TECH / 2B) — هذا مستعمل ممتاز بسعر السوق.',
      specifications: {
        Year: '2024',
        Color: 'Desert Titanium',
        Sim: 'Dual eSIM / Physical حسب النسخة',
        Box: 'علبة أصلية + كابل USB-C',
        Warranty: 'شهر ضمان محل',
      },
      purchase_date: '2026-07-02',
      inventory_date: now,
      internal_notes: 'نسخة الشرق الأوسط — FaceTime مفعّل',
      availability: 'available',
      cover_image_id: IMAGE.iphoneCover,
      image_ids: [IMAGE.iphoneCover],
      created_at: now,
      updated_at: now,
    },
  ];

  const { error: productsError } = await supabase.from('products').upsert(products);
  if (productsError) throw productsError;

  // Point any leftover catalog rows (e.g. admin duplicates) at the new MacBook photos.
  await supabase
    .from('products')
    .update({
      cover_image_id: IMAGE.macbookCover,
      image_ids: [IMAGE.macbookCover, IMAGE.macbookSide],
      updated_at: now,
    })
    .in('id', ['prd_ms13khx31ugznpi8k', 'prd_ms13l9bxl9fk56hsw']);

  const accessories = [
    {
      id: 'acc_sample_magic_mouse',
      name: 'Magic Mouse (USB-C) — أبيض',
      category: 'mice',
      quantity: 9,
      price: 5250,
      cost_price: 3900,
      description:
        'ماجيك ماوس أصلي بمنفذ USB-C، أبيض. متوسط السوق في مصر حوالي 5,000–6,000 جنيه.',
      cover_image_id: IMAGE.magicMouse,
      image_ids: [IMAGE.magicMouse],
      availability: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'acc_sample_usbc_charger',
      name: 'شاحن آبل USB-C 20W أصلي',
      category: 'chargers',
      quantity: 24,
      price: 1199,
      cost_price: 750,
      description:
        'رأس شاحن آبل 20 واط أصلي — الأكثر طلباً مع الآيفون والآيباد. سعر السوق تقريباً 1,000–1,500 جنيه.',
      cover_image_id: IMAGE.usbcCharger,
      image_ids: [IMAGE.usbcCharger],
      availability: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'acc_sample_magic_keyboard',
      name: 'Magic Keyboard مع أرقام — عربي',
      category: 'keyboards',
      quantity: 5,
      price: 7850,
      cost_price: 5900,
      description:
        'لوحة مفاتيح ماجيك مع لوحة أرقام، تخطيط عربي/إنجليزي. الأسعار في مصر تتراوح تقريباً بين 7,500 و10,700 جنيه حسب الموديل والمورد.',
      cover_image_id: IMAGE.magicKeyboard,
      image_ids: [IMAGE.magicKeyboard],
      availability: true,
      created_at: now,
      updated_at: now,
    },
  ];

  const { error: accessoriesError } = await supabase.from('accessories').upsert(accessories);
  if (accessoriesError) throw accessoriesError;

  console.log('Seed complete — old images purged, new img_v2_* photos linked:', {
    currency: 'EGP',
    images: imageDefs.map((d) => d.id),
    products: products.map((p) => ({
      id: p.id,
      model: p.model,
      cover: p.cover_image_id,
    })),
  });
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
