import { GoogleGenerativeAI } from "@google/generative-ai";

// หมายเหตุ: ในโปรเจกต์จริง ควรเก็บ API Key ไว้ใน Environment Variable (.env)
const apiKey = "AIzaSyDyBpGS2hwbuALEypdsu_WI1V5OmqTx7nY"; // ใช้ Key ของคุณที่ให้มา

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-09-2025" });

export const analyzeStudentProfile = async (studentData) => {
  try {
    // แปลงข้อมูลให้ Gemini เข้าใจบริบทมากขึ้น
    const attendanceTrend = studentData.attendanceHistory 
      ? JSON.stringify(studentData.attendanceHistory.slice(-10)) // ส่ง 10 ครั้งล่าสุด
      : "No attendance data yet";

    const prompt = `
      You are an expert Student Learning Behavior Analyst, Education Retention Specialist, and Customer Relationship Expert for a language learning center (AnnyTalk).
      
      Analyze the student data provided below and produce the output ONLY in JSON format, strictly following the rules.

      === STUDENT DATA ===
      Name: ${studentData.studentName}
      Status: ${studentData.status}
      Membership: ${studentData.memberStatus}
      Remaining Hours: ${studentData.credits}
      Total Package: ${studentData.totalHours}
      Used Hours: ${studentData.usedHours}
      Attendance Trend (Last 10 sessions): ${attendanceTrend}
      Coach Notes: ${studentData.notes || "No specific notes provided."}
      ====================

      === HOUR REMAINING TIERS (RENEWAL URGENCY) ===
      Tier 2: >= 16 hours remaining → Light renewal suggestion
      Tier 1: <= 8 hours remaining → High urgency, follow up within 48 hours
      Mid Tier: 9-15 hours remaining → Standard follow up

      === DROPOUT RISK INDICATORS ===
      Consider these factors:
      - Attendance trend (past 10 sessions)
      - Absence spikes
      - Engagement level
      - Learning performance notes from the coach
      - Behavior changes (tired, distracted, unmotivated)
      - Class participation
      - Make-up class usage
      - Remaining hours (Tier rules)
      - Past renewal history (if any)

      === LOGIC RULES (YOU MUST FOLLOW) ===
      1. Risk Level:
         - HIGH if: Hours <= 8 OR Absences increasing OR Low engagement OR Regression notes.
         - MEDIUM if: Hours 9-16 OR Mixed attendance OR Slow progress.
         - LOW if: Hours > 16 AND Consistent attendance AND Stable performance.
      
      2. Renewal Tier:
         - Tier 1 if hours <= 8
         - Tier 2 if hours >= 16
         - Mid Tier otherwise

      3. Renewal Urgency:
         - Immediate Action Needed if Tier 1
         - Recommend Follow Up if Tier 2 (This logic seems inverted in prompt, assuming Low hours = High Urgency. Let's stick to: Low Hours -> Immediate Action)
         *CORRECTION to prompt logic*: 
         - If Hours <= 8 (Tier 1) -> Immediate Action Needed
         - If Hours 9-16 (Mid Tier) -> Recommend Follow Up
         - If Hours > 16 (Tier 2) -> None

      4. Flags (Set automatically):
         - lowHours: true if hours <= 16
         - highAbsences: true if absent >= 2 of last 5 sessions (deduce from trend if available, else false)
         - performanceConcerns: true if coach notes show regression
         - suggestCoachFollowup: true if student engagement dropped

      === OUTPUT FORMAT ===
      Return ONLY valid JSON. No markdown formatting, no explanation text.
      {
        "summary": "Short summary of learning status (Thai language, 2–3 sentences).",
        "riskLevel": "Low | Medium | High",
        "renewalTier": "Tier 2 | Tier 1 | Mid Tier",
        "renewalUrgency": "None | Recommend Follow Up | Immediate Action Needed",
        "actionItem": "One clear recommendation for the staff (Thai language).",
        "talkingPoints": [
          "1–3 talking points for parents (Thai language)",
          "Second talking point",
          "Third (optional)"
        ],
        "flags": {
          "lowHours": boolean,
          "highAbsences": boolean,
          "performanceConcerns": boolean,
          "suggestCoachFollowup": boolean
        }
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up potential markdown from LLM response
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
    
  } catch (error) {
    console.error("Error analyzing student with Gemini:", error);
    // Fallback mock data in case of error to prevent UI crash
    return {
      summary: "ไม่สามารถวิเคราะห์ข้อมูลได้ในขณะนี้ โปรดตรวจสอบการเชื่อมต่อ",
      riskLevel: "Medium",
      renewalTier: "Mid Tier",
      renewalUrgency: "Recommend Follow Up",
      actionItem: "ตรวจสอบข้อมูลด้วยตนเอง",
      talkingPoints: ["ตรวจสอบจำนวนชั่วโมงคงเหลือ", "สอบถามความพึงพอใจเบื้องต้น"],
      flags: { lowHours: false, highAbsences: false, performanceConcerns: false, suggestCoachFollowup: false }
    };
  }
};

export const draftFollowUpMessage = async (studentData, intent) => {
  try {
    const prompt = `
      Draft a polite and professional LINE message (in Thai) to a parent from "AnnyTalk School".
      Student: ${studentData.studentName}
      Parent: ${studentData.parentName || "ผู้ปกครอง"}
      Situation: The staff wants to send a message about "${intent}".
      Context: Student has ${studentData.credits} hours left. Status is ${studentData.status}.
      
      Keep it short, friendly, and encouraging. Use emojis appropriate for a school context.
      Return ONLY the message text.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error drafting message with Gemini:", error);
    throw error;
  }
};