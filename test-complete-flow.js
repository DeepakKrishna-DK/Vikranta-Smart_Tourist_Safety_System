/**
 * Complete Flow Test - Registration to Dashboard
 * Tests the entire user journey from registration to accessing dashboard
 */

const https = require('https');
const http = require('http');

// Skip SSL certificate validation for localhost
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.log('\n🎯 Testing Complete Tourist Registration Flow\n');
console.log('=' + '='.repeat(50) + '\n');

let testUniqueId = null;

// Helper function for API requests
function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const result = JSON.parse(responseData);
                    resolve({ status: res.statusCode, data: result });
                } catch (error) {
                    reject(new Error('Failed to parse response: ' + responseData));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Test 1: Register a tourist
async function testRegistration() {
    console.log('📝 Step 1: Testing Tourist Registration...');
    
    const testData = {
        name: 'Test Tourist Flow',
        nationality: 'Test Country',
        email: 'test@example.com',
        phone: '+1234567890'
    };
    
    try {
        const response = await makeRequest('POST', '/api/tourist/register', testData);
        
        if (response.status === 200 && response.data.success) {
            testUniqueId = response.data.uniqueId;
            console.log('   ✅ Registration successful');
            console.log('   📋 Unique ID:', testUniqueId);
            console.log('   🔗 Transaction Hash:', response.data.transactionHash);
            return true;
        } else {
            console.log('   ❌ Registration failed:', response.data.message);
            return false;
        }
    } catch (error) {
        console.log('   ❌ Registration error:', error.message);
        return false;
    }
}

// Test 2: Verify tourist info retrieval
async function testInfoRetrieval() {
    console.log('\n📄 Step 2: Testing Tourist Info Retrieval...');
    
    try {
        const response = await makeRequest('GET', `/api/tourist/info/${testUniqueId}`);
        
        if (response.status === 200 && response.data.success) {
            console.log('   ✅ Info retrieval successful');
            console.log('   👤 Name:', response.data.data.name);
            console.log('   🌍 Nationality:', response.data.data.nationality);
            console.log('   📅 Registration Date:', new Date(response.data.data.registrationDate * 1000).toLocaleString());
            console.log('   🔍 Verification Status:', response.data.data.isVerified ? 'Verified' : 'Pending');
            return true;
        } else {
            console.log('   ❌ Info retrieval failed:', response.data.message);
            return false;
        }
    } catch (error) {
        console.log('   ❌ Info retrieval error:', error.message);
        return false;
    }
}

// Test 3: Test frontend access
async function testFrontendAccess() {
    console.log('\n🌐 Step 3: Testing Frontend Access...');
    
    return new Promise((resolve) => {
        // Try HTTPS first, then HTTP if it fails
        const httpsOptions = {
            hostname: 'localhost',
            port: 443,
            path: '/tourist-auth.html',
            method: 'GET',
            rejectUnauthorized: false
        };

        const httpOptions = {
            hostname: 'localhost',
            port: 80,
            path: '/tourist-auth.html',
            method: 'GET'
        };

        // Try HTTPS first
        const req = https.request(httpsOptions, (res) => {
            let html = '';
            
            res.on('data', (chunk) => {
                html += chunk;
            });
            
            res.on('end', () => {
                if (html.includes('Tourist Portal') && html.includes('Register')) {
                    console.log('   ✅ Frontend accessible');
                    console.log('   📱 Tourist Auth page loaded correctly');
                    resolve(true);
                } else {
                    console.log('   ❌ Frontend loaded but content incorrect');
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.log('   ⚠️ HTTPS failed, trying HTTP...');
            
            // Try HTTP fallback
            const httpReq = http.request(httpOptions, (res) => {
                let html = '';
                
                res.on('data', (chunk) => {
                    html += chunk;
                });
                
                res.on('end', () => {
                    if (html.includes('Tourist Portal') && html.includes('Register')) {
                        console.log('   ✅ Frontend accessible via HTTP');
                        console.log('   📱 Tourist Auth page loaded correctly');
                        resolve(true);
                    } else {
                        console.log('   ❌ Frontend loaded but content incorrect');
                        resolve(false);
                    }
                });
            });

            httpReq.on('error', (httpError) => {
                console.log('   ❌ Both HTTPS and HTTP failed:', httpError.message);
                resolve(false);
            });

            httpReq.end();
        });

        req.end();
    });
}

// Run all tests
async function runCompleteTest() {
    try {
        console.log('🚀 Starting complete flow test...\n');

        // Test backend API
        if (!await testRegistration()) {
            console.log('\n❌ Registration test failed. Stopping tests.');
            return;
        }

        if (!await testInfoRetrieval()) {
            console.log('\n❌ Info retrieval test failed. Stopping tests.');
            return;
        }

        // Test frontend access
        if (!await testFrontendAccess()) {
            console.log('\n❌ Frontend access test failed.');
            return;
        }

        // Final results
        console.log('\n' + '='.repeat(60));
        console.log('🎉 ALL TESTS PASSED! 🎉');
        console.log('='.repeat(60));
        console.log('\n📋 Test Summary:');
        console.log('1. ✅ Tourist Registration Working');
        console.log('2. ✅ Info Retrieval Working');
        console.log('3. ✅ Frontend Access Working');
        
        console.log('\n🔗 Next Steps:');
        console.log(`1. Open browser: https://localhost/tourist-auth.html`);
        console.log(`2. Use the login tab with ID: ${testUniqueId}`);
        console.log(`3. Or register a new tourist`);
        console.log(`4. Access dashboard: https://localhost/dashboard.html?uniqueId=${testUniqueId}`);
        
        console.log('\n💡 If you\'re still having issues:');
        console.log('- Clear browser cache and cookies');
        console.log('- Accept the SSL certificate when prompted');
        console.log('- Check browser developer console for errors');
        
    } catch (error) {
        console.log('\n❌ Test suite error:', error.message);
    }
}

// Run the tests
runCompleteTest();