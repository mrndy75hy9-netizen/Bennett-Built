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

/* =========================
   HELPERS
========================= */

function value(id) {
  return document.getElementById(id)?.value || "";
}

function clearValue(id) {
  const field = document.getElementById(id);
  if (field) field.value = "";
}

function clearFiles(id) {
  const field = document.getElementById(id);
  if (field) field.value = "";
}

function setResults(html) {
  const results = document.getElementById("results");
  if (results) results.innerHTML = html;
}

function safeFileName(name) {
  return name
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "");
}

function getStatusClass(status) {
  const s = String(status || "").toLowerCase();

  if (s.includes("urgent")) return "urgentCard";
  if (s.includes("waiting")) return "waitingCard";
  if (s.includes("ready")) return "readyCard";
  if (s.includes("completed") || s.includes("paid")) return "doneCard";

  return "";
}

function card(html, status = "") {
  const statusClass = getStatusClass(status);
  return `<div class="resultCard ${statusClass}">${html}</div>`;
}

function renderFileLinks(files = []) {
  if (!files.length) return "";

  let html = `<br><strong>Uploads:</strong><br>`;

  files.forEach((file, index) => {
    html += `<a href="${file.url}" target="_blank">File ${index + 1}: ${file.name}</a><br>`;
  });

  return html;
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
    const url = await getDownloadURL(storageRef);

    uploaded.push({
      name: file.name,
      path,
      url,
      type: file.type || "unknown",
      size: file.size || 0
    });
  }

  return uploaded;
}

/* =========================
   NAVIGATION
========================= */

window.showTab = function (tabId) {
  document.querySelectorAll(".tabPage").forEach(page => {
    page.classList.add("hidden");
  });

  const selected = document.getElementById(tabId);
  if (selected) selected.classList.remove("hidden");

  window.scrollTo({ top: 0, behavior: "smooth" });
};

window.showDash = function (tabId) {
  document.querySelectorAll(".dashPage").forEach(page => {
    page.classList.add("hidden");
  });

  const selected = document.getElementById(tabId);
  if (selected) selected.classList.remove("hidden");

  setResults("");
};

/* =========================
   PUBLIC FORMS
========================= */

window.saveCustomer = async function () {
  const name = value("custName");
  const phone = value("custPhone");

  if (!name || !phone) {
    alert("Please enter customer name and phone.");
    return;
  }

  try {
    alert("Saving customer and uploading files...");

    const files = await uploadFiles("custFiles", "publicUploads/customer-intake");

    const data = {
      name,
      phone,
      email: value("custEmail"),
      vehicle: value("vehicleInfo"),
      vin: value("vin"),
      issue: value("issue"),
      files,
      status: "New",
      priority: "Normal",
      createdAt: new Date()
    };

    await addDoc(collection(db, "customers"), data);

    await addDoc(collection(db, "vehicles"), {
      customerName: data.name,
      phone: data.phone,
      vehicle: data.vehicle,
      vin: data.vin,
      files,
      createdAt: new Date()
    });

    clearValue("custName");
    clearValue("custPhone");
    clearValue("custEmail");
    clearValue("vehicleInfo");
    clearValue("vin");
    clearValue("issue");
    clearFiles("custFiles");

    alert("Customer intake saved!");
  } catch (error) {
    console.error(error);
    alert("Error saving customer: " + error.message);
  }
};

window.saveAppointment = async function () {
  const name = value("apptName");
  const phone = value("apptPhone");
  const date = value("apptDate");

  if (!name || !phone || !date) {
    alert("Please enter name, phone, and requested date.");
    return;
  }

  try {
    alert("Saving appointment and uploading files...");

    const files = await uploadFiles("apptFiles", "publicUploads/appointments");

    await addDoc(collection(db, "appointments"), {
      name,
      phone,
      vehicle: value("apptVehicle"),
      date,
      time: value("apptTime"),
      service: value("apptService"),
      files,
      status: "Requested",
      createdAt: new Date()
    });

    clearValue("apptName");
    clearValue("apptPhone");
    clearValue("apptVehicle");
    clearValue("apptDate");
    clearValue("apptTime");
    clearValue("apptService");
    clearFiles("apptFiles");

    alert("Appointment request saved!");
  } catch (error) {
    console.error(error);
    alert("Error saving appointment: " + error.message);
  }
};

window.saveEstimate = async function () {
  const name = value("estName");
  const phone = value("estPhone");
  const details = value("estDetails");

  if (!name || !phone || !details) {
    alert("Please enter name, phone, and job details.");
    return;
  }

  try {
    alert("Saving estimate and uploading files...");

    const files = await uploadFiles("estFiles", "publicUploads/estimates");

    await addDoc(collection(db, "estimates"), {
      name,
      phone,
      vehicle: value("estVehicle"),
      details,
      files,
      status: "New Estimate",
      createdAt: new Date()
    });

    clearValue("estName");
    clearValue("estPhone");
    clearValue("estVehicle");
    clearValue("estDetails");
    clearFiles("estFiles");

    alert("Estimate request saved!");
  } catch (error) {
    console.error(error);
    alert("Error saving estimate: " + error.message);
  }
};

/* =========================
   AUTH
========================= */

window.login = async function () {
  try {
    await signInWithEmailAndPassword(
      auth,
      value("loginEmail"),
      value("loginPassword")
    );

    clearValue("loginPassword");
  } catch (error) {
    alert(error.message);
  }
};

window.logout = async function () {
  await signOut(auth);
};

onAuthStateChanged(auth, (user) => {
  const dashboard = document.getElementById("dashboard");
  const loginStatus = document.getElementById("loginStatus");

  if (user) {
    dashboard?.classList.remove("hidden");
    if (loginStatus) loginStatus.innerText = "Logged in as " + user.email;
    updateCounts();
  } else {
    dashboard?.classList.add("hidden");
    if (loginStatus) loginStatus.innerText = "Not logged in";
    setResults("");
  }
});

/* =========================
   DASHBOARD SAVES
========================= */

window.saveServiceLog = async function () {
  const customer = value("jobCustomer");
  const vehicle = value("jobVehicle");

  if (!customer || !vehicle) {
    alert("Enter customer and vehicle.");
    return;
  }

  try {
    alert("Saving job and uploading files...");

    const files = await uploadFiles("jobFiles", "shopFiles/job-logs");

    await addDoc(collection(db, "serviceLogs"), {
      customer,
      vehicle,
      assignedTo: value("assignedTo"),
      status: value("jobStatus"),
      priority: value("priority"),
      partsNeeded: value("partsNeeded"),
      laborNotes: value("laborNotes"),
      internalNotes: value("internalJobNotes"),
      paymentStatus: value("paymentStatus"),
      paperwork: value("paperwork"),
      followUpDate: value("followUpDate"),
      files,
      createdAt: new Date(),
      lastUpdated: new Date()
    });

    clearValue("jobCustomer");
    clearValue("jobVehicle");
    clearValue("assignedTo");
    clearValue("partsNeeded");
    clearValue("laborNotes");
    clearValue("internalJobNotes");
    clearValue("paymentStatus");
    clearValue("paperwork");
    clearValue("followUpDate");
    clearFiles("jobFiles");

    alert("Job log saved!");
    updateCounts();
  } catch (error) {
    console.error(error);
    alert("Error saving job: " + error.message);
  }
};

window.saveTask = async function () {
  const title = value("taskTitle");

  if (!title) {
    alert("Enter a task.");
    return;
  }

  try {
    await addDoc(collection(db, "employeeTasks"), {
      title,
      assignedTo: value("taskAssigned"),
      dueDate: value("taskDue"),
      status: "Open",
      createdAt: new Date()
    });

    clearValue("taskTitle");
    clearValue("taskAssigned");
    clearValue("taskDue");

    alert("Task saved!");
  } catch (error) {
    console.error(error);
    alert("Error saving task: " + error.message);
  }
};

window.saveInternalNote = async function () {
  const note = value("internalNote");

  if (!note) {
    alert("Enter a note.");
    return;
  }

  try {
    await addDoc(collection(db, "internalNotes"), {
      note,
      createdAt: new Date()
    });

    clearValue("internalNote");

    alert("Internal note saved!");
  } catch (error) {
    console.error(error);
    alert("Error saving note: " + error.message);
  }
};

/* =========================
   LOADERS
========================= */

window.loadCustomers = async function () {
  const snap = await getDocs(collection(db, "customers"));
  let html = "<h3>Customers</h3>";

  snap.forEach(doc => {
    const c = doc.data();

    html += card(`
      <strong>${c.name || ""}</strong><br>
      <a href="tel:${c.phone || ""}">Call</a> |
      <a href="sms:${c.phone || ""}">Text</a><br>
      Phone: ${c.phone || ""}<br>
      Email: ${c.email || ""}<br>
      Vehicle: ${c.vehicle || ""}<br>
      VIN: ${c.vin || ""}<br>
      Issue: ${c.issue || ""}<br>
      <span class="badge">${c.status || "New"}</span>
      <span class="badge">${c.priority || "Normal"}</span>
      ${renderFileLinks(c.files)}
    `, c.status);
  });

  setResults(html);
};

window.loadVehicles = async function () {
  const snap = await getDocs(collection(db, "vehicles"));
  let html = "<h3>Vehicles</h3>";

  snap.forEach(doc => {
    const v = doc.data();

    html += card(`
      <strong>${v.vehicle || ""}</strong><br>
      Customer: ${v.customerName || ""}<br>
      <a href="tel:${v.phone || ""}">Call</a> |
      <a href="sms:${v.phone || ""}">Text</a><br>
      VIN: ${v.vin || ""}
      ${renderFileLinks(v.files)}
    `);
  });

  setResults(html);
};

window.loadAppointments = async function () {
  const snap = await getDocs(collection(db, "appointments"));
  let html = "<h3>Appointments</h3>";

  snap.forEach(doc => {
    const a = doc.data();

    html += card(`
      <strong>${a.name || ""}</strong><br>
      <a href="tel:${a.phone || ""}">Call</a> |
      <a href="sms:${a.phone || ""}">Text</a><br>
      Vehicle: ${a.vehicle || ""}<br>
      Date: ${a.date || ""}<br>
      Time: ${a.time || ""}<br>
      Service: ${a.service || ""}<br>
      <span class="badge">${a.status || ""}</span>
      ${renderFileLinks(a.files)}
    `, a.status);
  });

  setResults(html);
};

window.loadEstimates = async function () {
  const snap = await getDocs(collection(db, "estimates"));
  let html = "<h3>Estimates</h3>";

  snap.forEach(doc => {
    const e = doc.data();

    html += card(`
      <strong>${e.name || ""}</strong><br>
      <a href="tel:${e.phone || ""}">Call</a> |
      <a href="sms:${e.phone || ""}">Text</a><br>
      Vehicle: ${e.vehicle || ""}<br>
      Details: ${e.details || ""}<br>
      <span class="badge">${e.status || ""}</span>
      ${renderFileLinks(e.files)}
    `, e.status);
  });

  setResults(html);
};

window.loadJobs = async function () {
  const snap = await getDocs(collection(db, "serviceLogs"));
  let html = "<h3>Service / Job Logs</h3>";

  snap.forEach(doc => {
    const j = doc.data();

    html += card(`
      <strong>${j.customer || ""}</strong><br>
      Vehicle: ${j.vehicle || ""}<br>
      Assigned: ${j.assignedTo || ""}<br>
      Parts Needed: ${j.partsNeeded || ""}<br>
      Labor Notes: ${j.laborNotes || ""}<br>
      Internal Notes: ${j.internalNotes || ""}<br>
      Payment: ${j.paymentStatus || ""}<br>
      Paperwork: ${j.paperwork || ""}<br>
      Follow-up: ${j.followUpDate || ""}<br>
      <span class="badge">${j.status || ""}</span>
      <span class="badge">${j.priority || ""}</span>
      ${renderFileLinks(j.files)}
    `, j.status || j.priority);
  });

  setResults(html);
  updateCounts();
};

window.loadTasks = async function () {
  const snap = await getDocs(collection(db, "employeeTasks"));
  let html = "<h3>Employee Tasks</h3>";

  snap.forEach(doc => {
    const t = doc.data();

    html += card(`
      <strong>${t.title || ""}</strong><br>
      Assigned: ${t.assignedTo || ""}<br>
      Due: ${t.dueDate || ""}<br>
      <span class="badge">${t.status || ""}</span>
    `, t.status);
  });

  setResults(html);
};

window.loadInternalNotes = async function () {
  const snap = await getDocs(collection(db, "internalNotes"));
  let html = "<h3>Internal Notes</h3>";

  snap.forEach(doc => {
    const n = doc.data();

    html += card(`
      ${n.note || ""}
    `);
  });

  setResults(html);
};

/* =========================
   COUNTERS
========================= */

async function updateCounts() {
  const jobs = await getDocs(collection(db, "serviceLogs"));

  let active = 0;
  let parts = 0;
  let ready = 0;

  jobs.forEach(doc => {
    const j = doc.data();
    const status = j.status || "";

    if (status !== "Completed" && status !== "Paid") active++;
    if (status === "Waiting on Parts") parts++;
    if (status === "Ready for Pickup") ready++;
  });

  const activeEl = document.getElementById("activeCount");
  const partsEl = document.getElementById("partsCount");
  const readyEl = document.getElementById("readyCount");

  if (activeEl) activeEl.innerText = active;
  if (partsEl) partsEl.innerText = parts;
  if (readyEl) readyEl.innerText = ready;
}
