const { Jimp, rgbaToInt } = require('jimp');

async function createIcon() {
    const size = 512;
    const redBible = new Jimp({ width: size, height: size, color: 0x00000000 });

    // Colors
    const darkRed = rgbaToInt(180, 30, 30, 255);
    const deepRed = rgbaToInt(140, 20, 20, 255);
    const gold = rgbaToInt(218, 165, 32, 255);
    const darkGold = rgbaToInt(184, 134, 11, 255);
    const pagesWhite = rgbaToInt(240, 240, 235, 255);

    // Bible dimensions
    const margin = 80;
    const bookLeft = margin;
    const bookTop = margin + 20;
    const bookRight = size - margin - 30;
    const bookBottom = size - margin;

    // Draw Bible cover (red rectangle)
    for (let y = bookTop; y < bookBottom; y++) {
        for (let x = bookLeft; x < bookRight; x++) {
            redBible.setPixelColor(darkRed, x, y);
        }
    }

    // Draw spine shadow (darker red on left side)
    for (let y = bookTop; y < bookBottom; y++) {
        for (let x = bookLeft; x < bookLeft + 25; x++) {
            redBible.setPixelColor(deepRed, x, y);
        }
    }

    // Draw pages (white edge on right side)
    const pagesWidth = 15;
    for (let y = bookTop + 10; y < bookBottom - 10; y++) {
        for (let x = bookRight - pagesWidth; x < bookRight; x++) {
            redBible.setPixelColor(pagesWhite, x, y);
        }
    }

    // Draw gold cross in center
    const crossWidth = 40;
    const crossHeight = 140;
    const crossCenterX = Math.floor((bookLeft + bookRight - pagesWidth) / 2);
    const crossCenterY = Math.floor((bookTop + bookBottom) / 2);

    // Vertical part of cross
    for (let y = crossCenterY - crossHeight / 2; y < crossCenterY + crossHeight / 2; y++) {
        for (let x = crossCenterX - crossWidth / 2; x < crossCenterX + crossWidth / 2; x++) {
            redBible.setPixelColor(gold, Math.floor(x), Math.floor(y));
        }
    }

    // Horizontal part of cross
    const crossHWidth = 100;
    const crossHHeight = 40;
    const crossHOffsetY = -20;
    for (let y = crossCenterY - crossHHeight / 2 + crossHOffsetY; y < crossCenterY + crossHHeight / 2 + crossHOffsetY; y++) {
        for (let x = crossCenterX - crossHWidth / 2; x < crossCenterX + crossHWidth / 2; x++) {
            redBible.setPixelColor(gold, Math.floor(x), Math.floor(y));
        }
    }

    // Add shadow to cross for depth (darker gold on bottom-right)
    for (let y = crossCenterY - crossHeight / 2 + 3; y < crossCenterY + crossHeight / 2; y++) {
        for (let x = crossCenterX - crossWidth / 2 + 3; x < crossCenterX + crossWidth / 2; x++) {
            if (Math.floor(x) >= crossCenterX && Math.floor(y) >= crossCenterY) {
                redBible.setPixelColor(darkGold, Math.floor(x), Math.floor(y));
            }
        }
    }

    // Save the image
    await redBible.write('C:\\Users\\alfre\\OneDrive\\Desktop\\BibleVerseGate_PlayStore_Icon.png');
    console.log('✓ Red Bible icon created successfully!');
    console.log('✓ Saved to: C:\\Users\\alfre\\OneDrive\\Desktop\\BibleVerseGate_PlayStore_Icon.png');
    console.log('✓ Size: 512x512 PNG (ready for Play Store)');
}

createIcon().catch(err => {
    console.error('Error creating icon:', err);
    process.exit(1);
});
