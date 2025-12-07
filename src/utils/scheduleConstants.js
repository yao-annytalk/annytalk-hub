export const COACH_LIST = {
  "Kier": "Coach Kier",
  "Ella": "Coach Ella",
  "Dario": "Coach Dario",
  "Jared": "Coach Jared",
  "Callum": "Coach Callum",
  "Bobby": "Coach Bobby",
  "Ben": "Coach Ben"
};

// 🗓️ THIS CONTROLS THE COLUMNS IN THE CALENDAR
export const DAYS_OF_WEEK_DISPLAY = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// 🕒 TIME SLOTS
export const TIME_SLOTS = [
  "09:00 - 11:00",
  "09:10 - 11:10",
  "11:00 - 13:00",
  "11:10 - 13:10",
  "14:00 - 16:00",
  "14:10 - 16:10",
  "16:30 - 18:30",
  "16:40 - 18:40",
  "17:00 - 19:00",
  "16:00 - 17:00",
  "18:00 - 20:00",
  "19:00 - 20:00"
];

// 🗺️ YOUR EXACT DAY MAP (Handles TTh, WF, etc.)
export const DAY_MAP = { 
  "Tue": ["Tue"], 
  "TTh": ["Tue", "Thu"], 
  "Fri": ["Fri"], 
  "WF": ["Wed", "Fri"], 
  "Wed": ["Wed"], 
  "Sa": ["Sat"], 
  "Su": ["Sun"], 
  "Mon": ["Mon"], 
  "Thu": ["Thu"], 
  "Sat": ["Sat"], 
  "Sun": ["Sun"],
  "Tue ": ["Tue"], // Handle spaces just in case
  "Thu ": ["Thu"]
};