import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDDPTMi__XAv8kDURyTaMTv2wpwzwmwhP0",
  authDomain: "bennett-built-automotive.firebaseapp.com",
  projectId: "bennett-built-automotive",
  storageBucket: "bennett-built-automotive.firebasestorage.app",
  messagingSenderId: "847909855571",
  appId: "1:847909855571:web:59a1b5c5a2b1fd099481a6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.addCustomer = async function () {
  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;

  if (!name || !phone) {
    alert("Enter name and phone");
    return;
  }

  await addDoc(collection(db, "customers"), {
    name,
    phone,
    createdAt: new Date()
  });

  alert("Customer saved!");
};
