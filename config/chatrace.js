// config/chatrace.js
module.exports = {
  apiUrl: process.env.CHATRACE_API_URL || 'https://api.chatrace.com',
  apiKey: process.env.CHATRACE_API_KEY,
  whatsappNumber: process.env.CHATRACE_WHATSAPP_NUMBER,
  
  // Flow IDs (numeric IDs from ChatRace dashboard)
  flowIds: {
    approval: process.env.CHATRACE_FLOW_ID_APPROVAL,
    rejection: process.env.CHATRACE_FLOW_ID_REJECTION,
  }
};