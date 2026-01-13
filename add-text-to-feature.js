const sharp = require('sharp');

async function addTextToFeature() {
    const width = 1024;
    const height = 500;

    // Create SVG text overlay
    const svgText = `
        <svg width="${width}" height="${height}">
            <style>
                .title {
                    fill: #FFFFFF;
                    font-size: 72px;
                    font-family: Arial, sans-serif;
                    font-weight: bold;
                }
                .subtitle {
                    fill: #CCCCCC;
                    font-size: 36px;
                    font-family: Arial, sans-serif;
                }
                .emoji {
                    font-size: 64px;
                }
            </style>
            <text x="450" y="200" class="title">Bible Verse Gate</text>
            <text x="450" y="280" class="subtitle">Take a moment to reflect</text>
            <text x="380" y="200" class="emoji">📖</text>
        </svg>
    `;

    // Overlay text on the feature graphic
    await sharp('C:\\Users\\alfre\\OneDrive\\Desktop\\BibleVerseGate_Feature_Graphic.png')
        .composite([{
            input: Buffer.from(svgText),
            top: 0,
            left: 0
        }])
        .toFile('C:\\Users\\alfre\\OneDrive\\Desktop\\BibleVerseGate_Feature_Graphic_Final.png');

    console.log('✓ Feature graphic with text created!');
    console.log('✓ Saved to: C:\\Users\\alfre\\OneDrive\\Desktop\\BibleVerseGate_Feature_Graphic_Final.png');
}

addTextToFeature().catch(err => {
    console.error('Error adding text:', err);
    process.exit(1);
});
