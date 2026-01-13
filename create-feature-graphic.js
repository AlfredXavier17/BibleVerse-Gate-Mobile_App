const { Jimp, rgbaToInt } = require('jimp');

async function createFeatureGraphic() {
    const width = 1024;
    const height = 500;

    // Create background with gradient effect
    const graphic = new Jimp({ width, height, color: 0x000000ff });

    // Colors
    const darkBg = rgbaToInt(18, 18, 18, 255);
    const accentBlue = rgbaToInt(33, 150, 243, 255);
    const darkRed = rgbaToInt(180, 30, 30, 255);
    const deepRed = rgbaToInt(140, 20, 20, 255);
    const gold = rgbaToInt(218, 165, 32, 255);
    const pagesWhite = rgbaToInt(240, 240, 235, 255);
    const textWhite = rgbaToInt(255, 255, 255, 255);

    // Draw dark background
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            graphic.setPixelColor(darkBg, x, y);
        }
    }

    // Draw accent gradient on right side
    for (let x = width - 200; x < width; x++) {
        for (let y = 0; y < height; y++) {
            const alpha = Math.floor(((x - (width - 200)) / 200) * 100);
            const color = rgbaToInt(33, 150, 243, alpha);
            graphic.setPixelColor(color, x, y);
        }
    }

    // Draw Bible icon on left side
    const iconSize = 280;
    const iconX = 100;
    const iconY = (height - iconSize) / 2;

    const margin = iconSize * 0.15;
    const bookLeft = iconX + margin;
    const bookTop = iconY + margin + 10;
    const bookRight = iconX + iconSize - margin - 15;
    const bookBottom = iconY + iconSize - margin;

    // Draw Bible cover
    for (let y = bookTop; y < bookBottom; y++) {
        for (let x = bookLeft; x < bookRight; x++) {
            graphic.setPixelColor(darkRed, Math.floor(x), Math.floor(y));
        }
    }

    // Draw spine shadow
    for (let y = bookTop; y < bookBottom; y++) {
        for (let x = bookLeft; x < bookLeft + 15; x++) {
            graphic.setPixelColor(deepRed, Math.floor(x), Math.floor(y));
        }
    }

    // Draw pages
    const pagesWidth = 10;
    for (let y = bookTop + 8; y < bookBottom - 8; y++) {
        for (let x = bookRight - pagesWidth; x < bookRight; x++) {
            graphic.setPixelColor(pagesWhite, Math.floor(x), Math.floor(y));
        }
    }

    // Draw gold cross
    const crossWidth = 25;
    const crossHeight = 90;
    const crossCenterX = Math.floor((bookLeft + bookRight - pagesWidth) / 2);
    const crossCenterY = Math.floor((bookTop + bookBottom) / 2);

    // Vertical part
    for (let y = crossCenterY - crossHeight / 2; y < crossCenterY + crossHeight / 2; y++) {
        for (let x = crossCenterX - crossWidth / 2; x < crossCenterX + crossWidth / 2; x++) {
            graphic.setPixelColor(gold, Math.floor(x), Math.floor(y));
        }
    }

    // Horizontal part
    const crossHWidth = 65;
    const crossHHeight = 25;
    const crossHOffsetY = -15;
    for (let y = crossCenterY - crossHHeight / 2 + crossHOffsetY; y < crossCenterY + crossHHeight / 2 + crossHOffsetY; y++) {
        for (let x = crossCenterX - crossHWidth / 2; x < crossCenterX + crossHWidth / 2; x++) {
            graphic.setPixelColor(gold, Math.floor(x), Math.floor(y));
        }
    }

    // Draw decorative elements on the right side
    // Draw a subtle cross pattern
    const rightCrossX = width - 300;
    const rightCrossY = height / 2;
    const rightCrossWidth = 8;
    const rightCrossHeight = 180;
    const lightGold = rgbaToInt(218, 165, 32, 80);

    // Vertical part of decorative cross
    for (let y = rightCrossY - rightCrossHeight / 2; y < rightCrossY + rightCrossHeight / 2; y++) {
        for (let x = rightCrossX - rightCrossWidth / 2; x < rightCrossX + rightCrossWidth / 2; x++) {
            graphic.setPixelColor(lightGold, Math.floor(x), Math.floor(y));
        }
    }

    // Horizontal part of decorative cross
    const rightCrossHWidth = 120;
    for (let y = rightCrossY - rightCrossWidth / 2; y < rightCrossY + rightCrossWidth / 2; y++) {
        for (let x = rightCrossX - rightCrossHWidth / 2; x < rightCrossX + rightCrossHWidth / 2; x++) {
            graphic.setPixelColor(lightGold, Math.floor(x), Math.floor(y));
        }
    }

    // Save the graphic
    await graphic.write('C:\\Users\\alfre\\OneDrive\\Desktop\\BibleVerseGate_Feature_Graphic.png');
    console.log('✓ Feature graphic created successfully!');
    console.log('✓ Saved to: C:\\Users\\alfre\\OneDrive\\Desktop\\BibleVerseGate_Feature_Graphic.png');
    console.log('✓ Size: 1024x500 PNG (ready for Play Store)');
}

createFeatureGraphic().catch(err => {
    console.error('Error creating feature graphic:', err);
    process.exit(1);
});
