// services/whatsappService.js
const axios = require("axios");
const chatraceConfig = require("../config/chatrace");

class WhatsAppService {
  constructor() {
    this.apiUrl = chatraceConfig.apiUrl;
    this.apiKey = chatraceConfig.apiKey;
    this.whatsappNumber = chatraceConfig.whatsappNumber;
    this.flowIds = chatraceConfig.flowIds; // Changed from templates to flowIds
  }

  /**
   * Format phone number to international format with +91
   * @param {string} phone - Phone number (with or without country code)
   * @returns {string} - Formatted phone number (e.g., "+919876543210")
   */
  formatPhoneNumber(phone) {
    // Remove all non-numeric characters
    let cleanPhone = phone.replace(/\D/g, "");
    
    // If doesn't start with 91, add it (assuming India)
    if (!cleanPhone.startsWith("91")) {
      cleanPhone = "91" + cleanPhone;
    }
    
    // Add + prefix for Chatrace
    return `+${cleanPhone}`;
  }

  /**
   * Send rejection notification via WhatsApp using Chatrace Flow
   * Flow variables:
   * full_name, Crop_Name, request_id, rejected_reason, verification_link
   * 
   * @param {Object} params - Parameters for rejection message
   * @returns {Promise<Object>} - API response
   */
  async sendRejectionNotification({
    phone,
    fullName,
    requestId,
    cropName,
    cropId,
    rejectionReason,
    rejectionNotes,
  }) {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      
      // Map rejection reasons to user-friendly messages in Kannada/English
      const reasonMessages = {
        'poor_photo_quality': 'ಫೋಟೋ ಗುಣಮಟ್ಟ ಕಳಪೆಯಾಗಿದೆ / Poor photo quality',
        'face_not_visible': 'ಮುಖ ಸ್ಪಷ್ಟವಾಗಿ ಕಾಣುತ್ತಿಲ್ಲ / Face not visible',
        'incorrect_location': 'ತಪ್ಪು ಸ್ಥಳ / Incorrect location',
        'insufficient_photos': 'ಸಾಕಷ್ಟು ಫೋಟೋಗಳಿಲ್ಲ / Insufficient photos',
        'duplicate_request': 'ನಕಲಿ ವಿನಂತಿ / Duplicate request',
        'crop_mismatch': 'ಬೆಳೆ ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ / Crop mismatch',
        'fake_or_manipulated': 'ನಕಲಿ ಅಥವಾ ಬದಲಾಯಿಸಿದ ಫೋಟೋ / Fake or manipulated',
        'incomplete_information': 'ಅಪೂರ್ಣ ಮಾಹಿತಿ / Incomplete information',
        'suspicious_activity': 'ಸಂಶಯಾಸ್ಪದ ಚಟುವಟಿಕೆ / Suspicious activity',
        'photo_too_dark': 'ಫೋಟೋ ತುಂಬಾ ಗಾಢವಾಗಿದೆ / Photo too dark',
        'photo_not_clear': 'ಫೋಟೋ ಸ್ಪಷ್ಟವಾಗಿಲ್ಲ / Photo not clear',
        'photo_not_focused': 'ಫೋಟೋ ಕೇಂದ್ರೀಕೃತವಾಗಿಲ್ಲ / Photo not focused',
        'partial_crop_visible': 'ಭಾಗಶಃ ಬೆಳೆ ಮಾತ್ರ ಕಾಣುತ್ತಿದೆ / Partial crop visible',
        'camera_angle_incorrect': 'ಕ್ಯಾಮೆರಾ ಕೋನ ತಪ್ಪಾಗಿದೆ / Camera angle incorrect',
        'photo_contains_obstructions': 'ಫೋಟೋದಲ್ಲಿ ಅಡೆತಡೆಗಳಿವೆ / Photo contains obstructions',
        'wrong_crop_uploaded': 'ತಪ್ಪು ಬೆಳೆ ಅಪ್ಲೋಡ್ ಮಾಡಲಾಗಿದೆ / Wrong crop uploaded',
        'crop_stage_mismatch': 'ಬೆಳೆಯ ಹಂತ ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ / Crop stage mismatch',
        'crop_area_not_clear': 'ಬೆಳೆ ಪ್ರದೇಶ ಸ್ಪಷ್ಟವಾಗಿಲ್ಲ / Crop area not clear',
        'crop_not_identifiable': 'ಬೆಳೆಯನ್ನು ಗುರುತಿಸಲಾಗುತ್ತಿಲ್ಲ / Crop not identifiable',
        'other': 'ಇತರ ಕಾರಣ / Other reason',
      };

      const reasonText = reasonMessages[rejectionReason] || rejectionReason;

      // Clean cropId - remove any URL parts, keep only the ID
      const cleanCropId = typeof cropId === 'string' ? cropId.split('/').pop() : cropId;

      // Using the /users endpoint with send_flow action (like the working NestJS code)
      const payload = {
        phone: formattedPhone,
        first_name: fullName || "Farmer",
        last_name: "farmer",
        gender: "male",
        actions: [
          {
            action: "set_field_value",
            field_name: "full_name",
            value: fullName || "Farmer"
          },
          {
            action: "set_field_value",
            field_name: "Crop_Name",
            value: cropName
          },
          {
            action: "set_field_value",
            field_name: "request_id",
            value: requestId
          },
          {
            action: "set_field_value",
            field_name: "rejected_reason",
            value: reasonText
          },
          {
            action: "set_field_value",
            field_name: "verification_link",
            value: cleanCropId
          },
          {
            action: "set_field_value",
            field_name: "phone",
            value: phone
          },
          {
            action: "send_flow",
            flow_id: parseInt(this.flowIds.rejection) // Use flow ID instead of template name
          }
        ]
      };

      console.log(`📱 Sending rejection WhatsApp to ${formattedPhone.replace('+91', '')}...`);
      console.log(`📤 Sending rejection WhatsApp to ${formattedPhone}:`, JSON.stringify(payload, null, 2));

      const response = await axios.post(
        `${this.apiUrl}/users`,
        payload,
        {
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "X-ACCESS-TOKEN": this.apiKey,
          },
        }
      );

      // Check for errors in response
      if (response.data?.error) {
        console.error(`❌ ChatRace API Error:`, response.data.error);
        return {
          success: false,
          error: response.data.error
        };
      }

      console.log(`✅ Rejection WhatsApp sent successfully to ${formattedPhone.replace('+91', '')}`);
      console.log(`✅ Response:`, response.data);
      return { success: true, data: response.data };

    } catch (error) {
      console.error(`❌ Error sending rejection WhatsApp:`, error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data || error.message 
      };
    }
  }

  /**
   * Send approval notification via WhatsApp using Chatrace Flow
   * @param {Object} params - Parameters for approval message
   * @returns {Promise<Object>} - API response
   */
  async sendApprovalNotification({
    phone,
    fullName,
    requestId,
    cropName,
    reviewedAt,
  }) {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);

      const payload = {
        phone: formattedPhone,
        first_name: fullName || "Farmer",
        last_name: "farmer",
        gender: "male",
        actions: [
          {
            action: "set_field_value",
            field_name: "full_name",
            value: fullName || "Farmer"
          },
          {
            action: "set_field_value",
            field_name: "Crop_Name",
            value: cropName
          },
          {
            action: "set_field_value",
            field_name: "request_status",
            value: "approved"
          },
          {
            action: "set_field_value",
            field_name: "request_date",
            value: reviewedAt
          },
          {
            action: "set_field_value",
            field_name: "request_id",
            value: requestId
          },
          {
            action: "send_flow",
            flow_id: parseInt(this.flowIds.approval)
          }
        ]
      };

      console.log(`📤 Sending approval WhatsApp to ${formattedPhone}:`, JSON.stringify(payload, null, 2));

      const response = await axios.post(
        `${this.apiUrl}/users`,
        payload,
        {
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "X-ACCESS-TOKEN": this.apiKey,
          },
        }
      );

      // Check for errors
      if (response.data?.error) {
        console.error(`❌ ChatRace API Error:`, response.data.error);
        return {
          success: false,
          error: response.data.error
        };
      }

      console.log(`✅ Approval WhatsApp sent successfully:`, response.data);
      return { success: true, data: response.data };

    } catch (error) {
      console.error(`❌ Error sending approval WhatsApp:`, error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data || error.message 
      };
    }
  }

  /**
   * Generic method to trigger any Chatrace flow
   * @param {Object} params - Flow parameters
   * @returns {Promise<Object>} - API response
   */
  async triggerFlow({
    phone,
    flowId,
    fullName,
    variables = {}
  }) {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);

      // Build actions array from variables
      const actions = Object.entries(variables).map(([key, value]) => ({
        action: "set_field_value",
        field_name: key,
        value: value
      }));

      // Add send_flow action at the end
      actions.push({
        action: "send_flow",
        flow_id: parseInt(flowId)
      });

      const payload = {
        phone: formattedPhone,
        first_name: fullName || "User",
        last_name: "user",
        gender: "male",
        actions: actions
      };

      console.log(`📤 Triggering flow ${flowId} for ${formattedPhone}:`, JSON.stringify(payload, null, 2));

      const response = await axios.post(
        `${this.apiUrl}/users`,
        payload,
        {
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "X-ACCESS-TOKEN": this.apiKey,
          },
        }
      );

      if (response.data?.error) {
        console.error(`❌ ChatRace API Error:`, response.data.error);
        return {
          success: false,
          error: response.data.error
        };
      }

      console.log(`✅ Flow triggered successfully:`, response.data);
      return { success: true, data: response.data };

    } catch (error) {
      console.error(`❌ Error triggering flow:`, error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data || error.message 
      };
    }
  }
}

module.exports = new WhatsAppService();