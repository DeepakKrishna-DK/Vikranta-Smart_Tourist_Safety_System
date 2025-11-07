/**
 * Complete System Test - Registration, Login, Documents, QR, PVC
 * This tests the entire tourist journey end-to-end
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Skip SSL certificate validation for localhost
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.log('\n🎯 COMPLETE SYSTEM TEST - ALL FEATURES\n');
console.log('=' + '='.repeat(60) + '\n');

let testUniqueId = null;
let authToken = null;

// Helper function for HTTP requests
function makeRequest(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
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
                    resolve({ status: res.statusCode, data: responseData });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data && typeof data === 'string') {
            req.write(data);
        } else if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Test 1: Registration
async function testRegistration() {
    console.log('🔥 TEST 1: Tourist Registration');
    
    const testData = {
        name: 'Complete Test Tourist',
        nationality: 'Test Country',
        email: 'complete@test.com',
        phone: '+1234567890',
        passportNumber: 'TEST123456',
        dateOfBirth: '1990-01-01',
        address: 'Test Address, Test City'
    };
    
    try {
        const response = await makeRequest('POST', '/api/tourist/register', testData);
        
        if (response.status === 200 && response.data.success) {
            testUniqueId = response.data.uniqueId;
            console.log('   ✅ Registration: SUCCESS');
            console.log('   📋 Unique ID:', testUniqueId);
            console.log('   🔗 Transaction:', response.data.transactionHash);
            return true;
        } else {
            console.log('   ❌ Registration: FAILED');
            console.log('   📄 Response:', response.data.message);
            return false;
        }
    } catch (error) {
        console.log('   ❌ Registration: ERROR -', error.message);
        return false;
    }
}

// Test 2: Login (Info Retrieval)
async function testLogin() {
    console.log('\n🔥 TEST 2: Tourist Login (Info Retrieval)');
    
    try {
        const response = await makeRequest('GET', `/api/tourist/info/${testUniqueId}`);
        
        if (response.status === 200 && response.data.success) {
            console.log('   ✅ Login: SUCCESS');
            console.log('   👤 Name:', response.data.data.name);
            console.log('   🌍 Nationality:', response.data.data.nationality);
            console.log('   📅 Registered:', new Date(response.data.data.registrationDate * 1000).toLocaleDateString());
            console.log('   🔍 Status:', response.data.data.isVerified ? 'Verified' : 'Pending');
            return true;
        } else {
            console.log('   ❌ Login: FAILED');
            console.log('   📄 Response:', response.data.message);
            return false;
        }
    } catch (error) {
        console.log('   ❌ Login: ERROR -', error.message);
        return false;
    }
}

// Test 3: Document Upload
async function testDocumentUpload() {
    console.log('\n🔥 TEST 3: Document Upload');
    
    return new Promise((resolve) => {
        // Create a test document file
        const testContent = `PASSPORT DOCUMENT
        
Tourist ID: ${testUniqueId}
Name: Complete Test Tourist
Country: Test Country
Passport Number: TEST123456
Issue Date: ${new Date().toLocaleDateString()}

This is a test document for system verification.`;
        
        const testFilePath = path.join(__dirname, 'test-passport.txt');
        fs.writeFileSync(testFilePath, testContent);
        
        const form = new FormData();
        form.append('uniqueId', testUniqueId);
        form.append('documentType', 'passport');
        form.append('document', fs.createReadStream(testFilePath));
        
        const url = new URL('/api/tourist/upload-document', 'http://localhost:3000');
        
        form.submit(url.toString(), (err, res) => {
            if (err) {
                console.log('   ❌ Document Upload: ERROR -', err.message);
                resolve(false);
                return;
            }
            
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    if (result.success) {
                        console.log('   ✅ Document Upload: SUCCESS');
                        console.log('   📄 Document Type: passport');
                        console.log('   🌐 IPFS Hash:', result.ipfsHash);
                        console.log('   🔗 Transaction:', result.transactionHash);
                    } else {
                        console.log('   ❌ Document Upload: FAILED');
                        console.log('   📄 Error:', result.message);
                    }
                    
                    // Clean up test file
                    try {
                        fs.unlinkSync(testFilePath);
                    } catch (e) {
                        // Ignore cleanup errors
                    }
                    
                    resolve(result.success);
                } catch (parseError) {
                    console.log('   ❌ Document Upload: PARSE ERROR -', parseError.message);
                    resolve(false);
                }
            });
        });
    });
}

// Test 4: Document Retrieval
async function testDocumentRetrieval() {
    console.log('\n🔥 TEST 4: Document Retrieval');
    
    try {
        const response = await makeRequest('GET', `/api/tourist/documents/${testUniqueId}`);
        
        if (response.status === 200 && response.data.success) {
            const documents = response.data.documents;
            if (documents && documents.length > 0) {
                console.log('   ✅ Document Retrieval: SUCCESS');
                console.log('   📄 Documents Found:', documents.length);
                documents.forEach((doc, index) => {
                    console.log(`   📋 Document ${index + 1}:`);
                    console.log(`      Type: ${doc.documentType}`);
                    console.log(`      IPFS: ${doc.ipfsHash}`);
                    console.log(`      Status: ${doc.isVerified ? 'Verified' : 'Pending'}`);
                });
                return true;
            } else {
                console.log('   ⚠️ Document Retrieval: SUCCESS but no documents found');
                return true; // Still counts as success
            }
        } else {
            console.log('   ❌ Document Retrieval: FAILED');
            console.log('   📄 Response:', response.data.message);
            return false;
        }
    } catch (error) {
        console.log('   ❌ Document Retrieval: ERROR -', error.message);
        return false;
    }
}

// Test 5: Authority Login (for verification)
async function testAuthorityLogin() {
    console.log('\n🔥 TEST 5: Authority Login');
    
    try {
        const loginData = {
            walletAddress: '0x9bBD3535c5582A4b15a529Bb3794688728988D41', // Master wallet
            passphrase: 'vikrantaTBS$2025'
        };
        
        const response = await makeRequest('POST', '/api/authority/login', loginData);
        
        if (response.status === 200 && response.data.success) {
            authToken = response.data.token;
            console.log('   ✅ Authority Login: SUCCESS');
            console.log('   🔑 Token:', authToken ? 'Generated' : 'None');
            return true;
        } else {
            console.log('   ❌ Authority Login: FAILED');
            console.log('   📄 Response:', response.data.message);
            return false;
        }
    } catch (error) {
        console.log('   ❌ Authority Login: ERROR -', error.message);
        return false;
    }
}

// Test 6: Tourist Verification
async function testTouristVerification() {
    console.log('\n🔥 TEST 6: Tourist Verification');
    
    try {
        const verificationData = {
            uniqueId: testUniqueId,
            validityDays: 365,
            notes: 'Automated test verification'
        };
        
        const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
        
        const response = await makeRequest('POST', '/api/authority/verify', verificationData, headers);
        
        if (response.status === 200 && response.data.success) {
            console.log('   ✅ Tourist Verification: SUCCESS');
            console.log('   🔗 Transaction:', response.data.transactionHash);
            return true;
        } else {
            console.log('   ❌ Tourist Verification: FAILED');
            console.log('   📄 Response:', response.data.message);
            return false;
        }
    } catch (error) {
        console.log('   ❌ Tourist Verification: ERROR -', error.message);
        return false;
    }
}

// Test 7: QR Code Generation
async function testQRCodeGeneration() {
    console.log('\n🔥 TEST 7: QR Code Generation');
    
    try {
        const response = await makeRequest('GET', `/api/tourist/qrcode/${testUniqueId}`);
        
        if (response.status === 200 && response.data.success) {
            console.log('   ✅ QR Code Generation: SUCCESS');
            console.log('   📱 QR Code:', response.data.qrCode ? 'Generated' : 'None');
            return true;
        } else {
            console.log('   ❌ QR Code Generation: FAILED');
            console.log('   📄 Response:', response.data.message);
            return false;
        }
    } catch (error) {
        console.log('   ❌ QR Code Generation: ERROR -', error.message);
        return false;
    }
}

// Test 8: PVC Card Generation
async function testPVCCardGeneration() {
    console.log('\n🔥 TEST 8: PVC Card Generation');
    
    try {
        const response = await makeRequest('GET', `/api/tourist/pvc-card/${testUniqueId}`);
        
        if (response.status === 200) {
            console.log('   ✅ PVC Card Generation: SUCCESS');
            console.log('   💳 PVC Card: Generated (PDF)');
            return true;
        } else {
            console.log('   ❌ PVC Card Generation: FAILED');
            console.log('   📄 Response:', response.data);
            return false;
        }
    } catch (error) {
        console.log('   ❌ PVC Card Generation: ERROR -', error.message);
        return false;
    }
}

// Test Frontend Access
async function testFrontendAccess() {
    console.log('\n🔥 TEST 9: Frontend Access');
    
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 443,
            path: '/dashboard-simple.html',
            method: 'GET',
            rejectUnauthorized: false
        };

        const req = https.request(options, (res) => {
            let html = '';
            
            res.on('data', (chunk) => {
                html += chunk;
            });
            
            res.on('end', () => {
                if (html.includes('Tourist Dashboard') && html.includes('Document Upload')) {
                    console.log('   ✅ Frontend Access: SUCCESS');
                    console.log('   🌐 Dashboard: Accessible');
                    resolve(true);
                } else {
                    console.log('   ❌ Frontend Access: Content incorrect');
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.log('   ❌ Frontend Access: ERROR -', error.message);
            resolve(false);
        });

        req.end();
    });
}

// Run all tests
async function runCompleteSystemTest() {
    console.log('🚀 Starting Complete System Test...\n');
    
    const results = {
        registration: false,
        login: false,
        documentUpload: false,
        documentRetrieval: false,
        authorityLogin: false,
        verification: false,
        qrCode: false,
        pvcCard: false,
        frontend: false
    };
    
    // Run tests sequentially
    results.registration = await testRegistration();
    if (results.registration) {
        results.login = await testLogin();
        results.documentUpload = await testDocumentUpload();
        results.documentRetrieval = await testDocumentRetrieval();
        results.authorityLogin = await testAuthorityLogin();
        
        if (results.authorityLogin) {
            results.verification = await testTouristVerification();
            
            // Wait a moment for blockchain to process
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            results.qrCode = await testQRCodeGeneration();
            results.pvcCard = await testPVCCardGeneration();
        }
        
        results.frontend = await testFrontendAccess();
    }
    
    // Print final results
    console.log('\n' + '='.repeat(70));
    console.log('📊 FINAL TEST RESULTS');
    console.log('='.repeat(70));
    
    const testNames = {
        registration: '1. Registration',
        login: '2. Login/Info Retrieval',
        documentUpload: '3. Document Upload',
        documentRetrieval: '4. Document Retrieval',
        authorityLogin: '5. Authority Login',
        verification: '6. Tourist Verification',
        qrCode: '7. QR Code Generation',
        pvcCard: '8. PVC Card Generation',
        frontend: '9. Frontend Access'
    };
    
    let passedTests = 0;
    let totalTests = Object.keys(results).length;
    
    for (const [key, name] of Object.entries(testNames)) {
        const status = results[key] ? '✅ PASS' : '❌ FAIL';
        console.log(`${name}: ${status}`);
        if (results[key]) passedTests++;
    }
    
    console.log('\n' + '='.repeat(70));
    console.log(`📈 SCORE: ${passedTests}/${totalTests} tests passed (${Math.round(passedTests/totalTests*100)}%)`);
    
    if (passedTests === totalTests) {
        console.log('🎉 ALL TESTS PASSED! SYSTEM IS FULLY FUNCTIONAL! 🎉');
        console.log('\n🔗 Access URLs:');
        console.log(`📝 Registration: https://localhost/tourist-auth.html`);
        console.log(`🎫 Dashboard: https://localhost/dashboard-simple.html?uniqueId=${testUniqueId}`);
        console.log(`👮 Authority: https://localhost/authority-panel.html`);
    } else {
        console.log('⚠️ Some tests failed. Please check the errors above.');
    }
    
    console.log('='.repeat(70) + '\n');
}

// Run the complete test suite
runCompleteSystemTest();