// Run with: node generate-icons.js
const sharp = require('sharp');
const path  = require('path');

const SRC  = path.join(__dirname, 'icons', 'icon-512.svg');
const ROOT = __dirname;

const icons = [
  // PWA / manifest
  { dest: 'icons/icon-192.png',  size: 192 },
  { dest: 'icons/icon-512.png',  size: 512 },

  // iOS App Store + device sizes
  { dest: 'ios/App/App/Assets.xcassets/AppIcon.appiconset/icon-1024.png', size: 1024 },
  { dest: 'ios/App/App/Assets.xcassets/AppIcon.appiconset/icon-180.png',  size: 180  },
  { dest: 'ios/App/App/Assets.xcassets/AppIcon.appiconset/icon-167.png',  size: 167  },
  { dest: 'ios/App/App/Assets.xcassets/AppIcon.appiconset/icon-152.png',  size: 152  },
  { dest: 'ios/App/App/Assets.xcassets/AppIcon.appiconset/icon-120.png',  size: 120  },
  { dest: 'ios/App/App/Assets.xcassets/AppIcon.appiconset/icon-87.png',   size: 87   },
  { dest: 'ios/App/App/Assets.xcassets/AppIcon.appiconset/icon-80.png',   size: 80   },
  { dest: 'ios/App/App/Assets.xcassets/AppIcon.appiconset/icon-76.png',   size: 76   },
  { dest: 'ios/App/App/Assets.xcassets/AppIcon.appiconset/icon-60.png',   size: 60   },
  { dest: 'ios/App/App/Assets.xcassets/AppIcon.appiconset/icon-58.png',   size: 58   },
  { dest: 'ios/App/App/Assets.xcassets/AppIcon.appiconset/icon-40.png',   size: 40   },
  { dest: 'ios/App/App/Assets.xcassets/AppIcon.appiconset/icon-29.png',   size: 29   },
  { dest: 'ios/App/App/Assets.xcassets/AppIcon.appiconset/icon-20.png',   size: 20   },
];

async function run() {
  for (const icon of icons) {
    const dest = path.join(ROOT, icon.dest);
    await sharp(SRC).resize(icon.size, icon.size).png().toFile(dest);
    console.log(`✓  ${icon.dest}  (${icon.size}×${icon.size})`);
  }
  console.log('\nAll icons generated.');
}

run().catch(err => { console.error(err); process.exit(1); });
