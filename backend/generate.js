const db = require('./db.js');
const crypto = require('crypto');

/**
 * Generate random access tokens for all voters
 * Tokens are: A1B2C3 format (6 character hex uppercase)
 */
async function generateVoterTokens() {
    try {
        console.log('🔄 Generating tokens for voters...');
        
        const [mahasiswa] = await db.execute(
            'SELECT nim FROM pemilih WHERE token IS NULL OR token = ""'
        );

        console.log(`ℹ️  Found ${mahasiswa.length} voters needing tokens`);

        let updated = 0;
        const batchSize = 100;

        for (let i = 0; i < mahasiswa.length; i += batchSize) {
            const batch = mahasiswa.slice(i, i + batchSize);
            
            for (let m of batch) {
                const randomToken = crypto.randomBytes(3).toString('hex').toUpperCase();
                await db.execute(
                    'UPDATE pemilih SET token = ? WHERE nim = ?',
                    [randomToken, m.nim]
                );
                updated++;
            }
            
            console.log(`✓ Generated tokens for ${Math.min(i + batchSize, mahasiswa.length)}/${mahasiswa.length} voters`);
        }

        console.log(`✅ Successfully generated ${updated} tokens!`);
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error generating tokens:', error.message);
        process.exit(1);
    }
}

generateVoterTokens();