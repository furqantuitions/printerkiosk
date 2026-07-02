import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBGrDrZJN-LF9-uV2t8o52jgH7HtjRtxc0",
  authDomain: "printer-kiosk-5198b.firebaseapp.com",
  projectId: "printer-kiosk-5198b",
  storageBucket: "printer-kiosk-5198b.firebasestorage.app",
  messagingSenderId: "750605882141",
  appId: "1:750605882141:web:237e935e503eb5396587f4",
  measurementId: "G-Z3K263ZZDW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);