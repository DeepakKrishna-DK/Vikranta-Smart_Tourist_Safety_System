/**
 * Quick Authority Verification Script
 * Verifies a tourist manually without MetaMask
 */

const http = require('http');

const uniqueId = 'epi686omTS'; // The test tourist ID
const API_URL = 'http://localhost:3000';

console.log('🔧 Manual Tourist Verification');
console.log('===============================\n');

// Direct verification using internal API
async function verifyTourist() {
    return new Promise((resolve, reject) => {
        const verificationData = {
            uniqueId: uniqueId,
            validityDays: 365,
            notes: 'Manual verification for testing'
        };

        const postData = JSON.stringify(verificationData);

        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/authority/verify-direct', // We'll create this endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.success) {
                        console.log('✅ Tourist verified successfully!');
                        console.log('📋 Unique ID:', uniqueId);
                        console.log('🔗 Transaction:', result.transactionHash);
                        console.log('\n🎉 Now you can access:');
                        console.log(`📱 QR Code: https://localhost/dashboard-simple.html?uniqueId=${uniqueId}`);
                        console.log(`💳 PVC Card: Download available in dashboard`);
                    } else {
                        console.log('❌ Verification failed:', result.message);
                    }
                } catch (error) {
                    console.log('❌ Parse error:', error.message);
                    console.log('Raw response:', data);
                }
                resolve();
            });
        });

        req.on('error', (error) => {
            console.log('❌ Request error:', error.message);
            resolve();
        });

        req.write(postData);
        req.end();
    });
}

// Try direct verification approach
async function tryDirectVerification() {
    console.log('Attempting direct tourist verification...\n');
    
    // First check if tourist exists
    const checkOptions = {
        hostname: 'localhost',
        port: 3000,
        path: `/api/tourist/info/${uniqueId}`,
        method: 'GET'
    };

    return new Promise((resolve) => {
        const req = http.request(checkOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.success) {
                        console.log('✅ Tourist found:', result.data.name);
                        console.log('📋 Current status:', result.data.isVerified ? 'Verified' : 'Pending');
                        
                        if (!result.data.isVerified) {
                            console.log('\n⚠️ Tourist needs verification for QR/PVC features');
                            console.log('💡 SOLUTION: You can manually verify this tourist by:');
                            console.log('1. Going to: https://localhost/authority-login.html');
                            console.log('2. Connect MetaMask wallet');
                            console.log('3. Enter passphrase: vikrantaTBS$2025');
                            console.log('4. Go to authority panel and verify the tourist');
                            console.log('\n📋 Tourist ID to verify:', uniqueId);
                        } else {
                            console.log('✅ Tourist is already verified!');
                            console.log('🎉 QR and PVC features should be available');
                        }
                    } else {
                        console.log('❌ Tourist not found');
                    }
                } catch (error) {
                    console.log('❌ Error checking tourist:', error.message);
                }
                resolve();
            });
        });
        
        req.on('error', (error) => {
            console.log('❌ Connection error:', error.message);
            resolve();
        });
        
        req.end();
    });
}

tryDirectVerification();