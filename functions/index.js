const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

// 🚨 PASTE YOUR ACTUAL KEY HERE
const PI_SERVER_API_KEY = process.env.PI_SERVER_API_KEY;
const PI_API_URL = "https://api.minepi.com/v2/payments";

// 1. APPROVE PAYMENT
exports.approvePiPayment = functions.https.onCall(async (request) => {
    // Safely extract the payload for both Firebase V1 and V2 formats without crashing
    const payload = request.data ? request.data : request;
    const paymentId = payload.paymentId || (typeof payload === 'string' ? payload : null);

    console.log("Extracted Payment ID:", paymentId);
    
    if (!paymentId) throw new functions.https.HttpsError('invalid-argument', 'Missing Payment ID');

    try {
        const response = await axios.post(`${PI_API_URL}/${paymentId}/approve`, {}, {
            headers: { 'Authorization': `Key ${PI_SERVER_API_KEY}` }
        });
        return { success: true, data: response.data };
    } catch (error) {
        const exactError = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error("Approval Error:", exactError);
        throw new functions.https.HttpsError('aborted', `Pi Network rejected approval: ${exactError}`);
    }
});

// 2. COMPLETE PAYMENT
exports.completePiPayment = functions.https.onCall(async (request) => {
    // Safely extract the payload
    const payload = request.data ? request.data : request;
    const paymentId = payload.paymentId;
    const txid = payload.txid;

    console.log("Extracted Completion IDs - Payment:", paymentId, "TXID:", txid);

    if (!paymentId || !txid) throw new functions.https.HttpsError('invalid-argument', 'Missing Payment ID or TXID');

    try {
        const response = await axios.post(`${PI_API_URL}/${paymentId}/complete`, { txid: txid }, {
            headers: { 'Authorization': `Key ${PI_SERVER_API_KEY}` }
        });
        return { success: true, data: response.data };
    } catch (error) {
        const exactError = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error("Completion Error:", exactError);
        throw new functions.https.HttpsError('aborted', `Pi Network rejected completion: ${exactError}`);
    }
});
