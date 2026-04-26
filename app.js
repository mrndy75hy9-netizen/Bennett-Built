import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-storage.js";

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
const auth = getAuth(app);
const storage = getStorage(app);

function value(id) {
  return document.getElementById(id)?.value || "";
}

function status(id, message) {
  const el = document.getElementById(id);
  if (el) el.innerText = message;
}

function resetForm(id) {
  const form = document.getElementById(id);
  if (form) form.reset();
}

function safeFileName(name) {
  return name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
}

async function uploadFiles(inputId, folderName) {
  const input = document.getElementById(inputId);
  if (!input || !input.files || input.files.length === 0) return [];

  const uploaded = [];

  for (const file of input.files) {
    const cleanName = safeFileName(file.name);
    const path = `${folderName}/${Date.now()}-${cleanName}`;
    const storageRef = ref(storage, path);

    await uploadBytes(storageRef, file);

    uploaded.push({
      name: file.name,
      path,
      type: file.type || "unknown",
      size: file.size || 0
    });
  }

  return uploaded;
}

async function renderFileLinks(files = []) {
  if (!files || files.length === 0) return "";

  let html = `<br><strong>Uploads:</strong><br>`;

  for (const file of files) {
    try {
      const fileRef = ref(storage, file.path);
      const url = await getDownloadURL(fileRef);
      html += `<a href="${url}" target="_blank">${file.name}</a><br>`;
    } catch {
      html += `<span>${file.name} - link unavailable</span><br>`;
    }
  }

  return html;
}

function card(html) {
  return `<div class="card">${html}</div>`;
}

/* CUSTOMER FORM */
window.saveCustomer = async function () {
  const name = value("custName");
  const phone = value("custPhone");
  const issue = value("issue");

  if (!name || !phone || !issue) {
    status("customerStatus", "Name, phone, and what it’s doing are needed.");
    return;
  }

  status("customerStatus", "Sending...");

  try {
    const files = await uploadFiles("custFiles", "customer-uploads");

    await addDoc(collection(db, "customers"), {
      name,
      phone,
      issue,
      files,
      status: "New",
      createdAt: new Date()
    });

    resetForm("intakeForm");
    status("customerStatus", "Got it. We’ll take a look.");
  } catch (error) {
    status("customerStatus", "Something didn’t send: " + error.message);
  }
};

/* ESTIMATE FORM */
window.saveEstimate = async function () {
  const name = value("estName");
  const phone = value("estPhone");
  const details = value("estDetails");

  if (!name || !phone || !details) {
    status("estimateStatus", "Name, phone, and details are needed.");
    return;
  }

  status("estimateStatus", "Sending...");

  try {
    const files = await uploadFiles("estFiles", "estimate-uploads");

    await addDoc(collection(db, "estimates"), {
      name,
      phone,
      details,
      files,
      status: "New Estimate",
      createdAt: new Date()
    });

    resetForm("estimateForm");
    status("estimateStatus", "Sent. We’ll give you a starting point.");
  } catch (error) {
    status("estimateStatus", "Something didn’t send: " + error.message);
  }
};

/* LOGIN */
window.login = async function () {
  const email = value("loginEmail");
  const password = value("loginPassword");

  if (!email || !password) {
    status("loginStatus", "Email and password needed.");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    status("loginStatus", error.message);
  }
};

window.logout = async function () {
  await signOut(auth);
};

onAuthStateChanged(auth, (user) => {
  const dashboard = document.getElementById("dashboard");

  if (user) {
    if (dashboard) dashboard.style.display = "block";
    status("loginStatus", "Logged in as " + user.email);
  } else {
    if (dashboard) dashboard.style.display = "none";
    status("loginStatus", "Not logged in");
  }
});

/* DASHBOARD */
window.loadCustomers = async function () {
  const results = document.getElementById("results");
  if (!results) return;

  results.innerHTML = "<h3>Customers</h3>";

  try {
    const snap = await getDocs(collection(db, "customers"));

    for (const doc of snap.docs) {
      const c = doc.data();
      const files = await renderFileLinks(c.files);

      results.innerHTML += card(`
        <strong>${c.name || ""}</strong><br>
        <a href="tel:${c.phone || ""}">Call</a> |
        <a href="sms:${c.phone || ""}">Text</a><br>
        Phone: ${c.phone || ""}<br>
        Issue: ${c.issue || ""}<br>
        <span>${c.status || "New"}</span>
        ${files}
      `);
    }
  } catch (error) {
    results.innerHTML += `<p>Couldn’t load customers: ${error.message}</p>`;
  }
};
