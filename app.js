import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy
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

/* BASIC HELPERS */

function value(id) {
  return document.getElementById(id)?.value?.trim() || "";
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
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
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase();
}

function cleanPhone(phone = "") {
  return phone.replace(/[^\d]/g, "");
}

function formatDate(timestamp) {
  if (!timestamp) return "";

  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  } catch {
    return "";
  }
}

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function statusClass(status = "", priority = "") {
  const s = status.toLowerCase();
  const p = priority.toLowerCase();

  if (p === "urgent") return "urgentCard";
  if (s.includes("waiting")) return "waitingCard";
  if (s.includes("ready")) return "readyCard";
  if (s.includes("completed") || s.includes("paid")) return "doneCard";

  return "";
}

function card(html, className = "") {
  return `<div class="resultCard ${className}">${html}</div>`;
}

/* FILE UPLOADS */

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
  if (!files || !files.length) return "";

  let html = `<br><strong>Uploads:</strong><br>`;

  for (const file of files) {
    try {
      const fileRef = ref(storage, file.path);
      const url = await getDownloadURL(fileRef);
      html += `<a href="${url}" target="_blank">${escapeHtml(file.name)}</a><br>`;
    } catch {
      html += `<span>${escapeHtml(file.name)} - link unavailable</span><br>`;
    }
  }

  return html;
}

/* NAVIGATION */

window.showTab = function (id) {
  document.querySelectorAll(".tabPage").forEach(section => {
    section.classList.add("hidden");
  });

  const target = document.getElementById(id);
  if (target) target.classList.remove("hidden");

  document.querySelectorAll(".mainTabs button").forEach(btn => {
    btn.classList.remove("activeTab");
  });

  const clicked = [...document.querySelectorAll(".mainTabs button")]
    .find(btn => btn.getAttribute("onclick")?.includes(id));

  if (clicked) clicked.classList.add("activeTab");

  window.scrollTo({ top: 0, behavior: "smooth" });
};

window.showDash = function (id) {
  document.querySelectorAll(".dashPage").forEach(section => {
    section.classList.add("hidden");
  });

  const target = document.getElementById(id);
  if (target) target.classList.remove("hidden");

  setResults("");
};

/* CUSTOMER FORMS */

window.saveCustomer = async function () {
  const name = value("custName");
  const phone = value("custPhone");

  if (!name || !phone) {
    alert("Please enter name and phone.");
    return;
  }

  try {
    setText("customerStatus", "Uploading and saving... hang tight.");

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
      createdAt: new Date()
    };

    await addDoc(collection(db, "customers"), data);

    await addDoc(collection(db, "vehicles"), {
      customerName: name,
      phone,
      vehicle: data.vehicle,
      vin: data.vin,
      files,
      createdAt: new Date()
    });

    ["custName", "custPhone", "custEmail", "vehicleInfo", "vin", "issue"].forEach(clearValue);
    clearFiles("custFiles");

    setText("customerStatus", "Sent. We’ll take a look.");
    alert("Got it. We’ll take a look.");
  } catch (error) {
    setText("customerStatus", "Something went wrong. Try again or text us.");
    alert("Error saving intake: " + error.message);
  }
};

window.saveAppointment = async function () {
  const name = value("apptName");
  const phone = value("apptPhone");
  const date = value("apptDate");

  if (!name || !phone || !date) {
    alert("Please enter name, phone, and date.");
    return;
  }

  try {
    setText("appointmentStatus", "Uploading and saving appointment request...");

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

    ["apptName", "apptPhone", "apptVehicle", "apptDate", "apptTime", "apptService"].forEach(clearValue);
    clearFiles("apptFiles");

    setText("appointmentStatus", "Request sent. We’ll confirm before it’s officially scheduled.");
    alert("Appointment request sent.");
  } catch (error) {
    setText("appointmentStatus", "Something went wrong. Try again or text us.");
    alert("Error saving appointment: " + error.message);
  }
};

window.saveEstimate = async function () {
  const name = value("estName");
  const phone = value("estPhone");
  const details = value("estDetails");

  if (!name || !phone || !details) {
    alert("Please enter name, phone, and details.");
    return;
  }

  try {
    setText("estimateStatus", "Uploading and saving estimate request...");

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

    ["estName", "estPhone", "estVehicle", "estDetails"].forEach(clearValue);
    clearFiles("estFiles");

    setText("estimateStatus", "Estimate request sent. We’ll give the best ballpark we can.");
    alert("Estimate request sent.");
  } catch (error) {
    setText("estimateStatus", "Something went wrong. Try again or text us.");
    alert("Error saving estimate: " + error.message);
  }
};

/* AUTH */

window.login = async function () {
  const email = value("loginEmail");
  const password = value("loginPassword");

  if (!email || !password) {
    alert("Enter email and password.");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    alert("Login error: " + error.message);
  }
};

window.logout = async function () {
  try {
    await signOut(auth);
  } catch (error) {
    alert("Logout error: " + error.message);
  }
};

onAuthStateChanged(auth, (user) => {
  const dashboard = document.getElementById("dashboard");
  const loginStatus = document.getElementById("loginStatus");

  if (user) {
    dashboard?.classList.remove("hidden");
    if (loginStatus) loginStatus.innerText = "Logged in as " + user.email;
    updateCounts();
    loadDashboardSummary();
  } else {
    dashboard?.classList.add("hidden");
    if (loginStatus) loginStatus.innerText = "Not logged in";
    setResults("");
  }
});

/* EMPLOYEE DASHBOARD SAVES */

window.saveServiceLog = async function () {
  const customer = value("jobCustomer");
  const vehicle = value("jobVehicle");

  if (!customer || !vehicle) {
    alert("Need customer and vehicle/project.");
    return;
  }

  try {
    setText("jobStatusLine", "Saving job...");

    const files = await uploadFiles("jobFiles", "jobs");

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
      createdAt: new Date()
    });

    [
      "jobCustomer",
      "jobVehicle",
      "assignedTo",
      "partsNeeded",
      "laborNotes",
      "internalJobNotes",
      "paymentStatus",
      "paperwork",
      "followUpDate"
    ].forEach(clearValue);

    clearFiles("jobFiles");

    setText("jobStatusLine", "Job saved.");
    await updateCounts();
    await loadJobs();
  } catch (err) {
    setText("jobStatusLine", "Error saving job.");
    alert("Error: " + err.message);
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

    ["taskTitle", "taskAssigned", "taskDue"].forEach(clearValue);

    alert("Task saved.");
    loadTasks();
  } catch (error) {
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

    alert("Note saved.");
    loadInternalNotes();
  } catch (error) {
    alert("Error saving note: " + error.message);
  }
};

/* LOAD HELPERS */

async function newestDocs(collectionName) {
  try {
    const q = query(collection(db, collectionName), orderBy("createdAt", "desc"));
    return await getDocs(q);
  } catch {
    return await getDocs(collection(db, collectionName));
  }
}

function contactLinks(phone = "", email = "") {
  const clean = cleanPhone(phone);
  let html = "";

  if (clean) {
    html += `<a href="tel:${clean}">Call</a> | <a href="sms:${clean}">Text</a><br>`;
  }

  if (email) {
    html += `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a><br>`;
  }

  return html;
}

/* LOAD RECORDS */

window.loadCustomers = async function () {
  setResults("<h3>Loading customers...</h3>");

  const snap = await newestDocs("customers");
  let html = "<h3>Customers</h3>";

  for (const doc of snap.docs) {
    const c = doc.data();
    const files = await renderFileLinks(c.files);

    html += card(`
      <strong>${escapeHtml(c.name || "")}</strong><br>
      ${contactLinks(c.phone, c.email)}
      Phone: ${escapeHtml(c.phone || "")}<br>
      Vehicle/Project: ${escapeHtml(c.vehicle || "")}<br>
      VIN: ${escapeHtml(c.vin || "")}<br>
      Issue: ${escapeHtml(c.issue || "")}<br>
      Created: ${formatDate(c.createdAt)}<br>
      <span class="badge">${escapeHtml(c.status || "New")}</span>
      ${files}
    `);
  }

  setResults(html);
};

window.loadVehicles = async function () {
  setResults("<h3>Loading vehicles/projects...</h3>");

  const snap = await newestDocs("vehicles");
  let html = "<h3>Vehicles / Projects</h3>";

  for (const doc of snap.docs) {
    const v = doc.data();
    const files = await renderFileLinks(v.files);

    html += card(`
      <strong>${escapeHtml(v.vehicle || "")}</strong><br>
      Customer: ${escapeHtml(v.customerName || "")}<br>
      Phone: ${escapeHtml(v.phone || "")}<br>
      VIN: ${escapeHtml(v.vin || "")}<br>
      Created: ${formatDate(v.createdAt)}
      ${files}
    `);
  }

  setResults(html);
};

window.loadAppointments = async function () {
  setResults("<h3>Loading appointments...</h3>");

  const snap = await newestDocs("appointments");
  let html = "<h3>Appointments</h3>";

  for (const doc of snap.docs) {
    const a = doc.data();
    const files = await renderFileLinks(a.files);

    html += card(`
      <strong>${escapeHtml(a.name || "")}</strong><br>
      ${contactLinks(a.phone)}
      Vehicle/Project: ${escapeHtml(a.vehicle || "")}<br>
      Requested Date: ${escapeHtml(a.date || "")}<br>
      Requested Time: ${escapeHtml(a.time || "")}<br>
      Service: ${escapeHtml(a.service || "")}<br>
      Created: ${formatDate(a.createdAt)}<br>
      <span class="badge">${escapeHtml(a.status || "Requested")}</span>
      ${files}
    `);
  }

  setResults(html);
};

window.loadEstimates = async function () {
  setResults("<h3>Loading estimates...</h3>");

  const snap = await newestDocs("estimates");
  let html = "<h3>Estimates</h3>";

  for (const doc of snap.docs) {
    const e = doc.data();
    const files = await renderFileLinks(e.files);

    html += card(`
      <strong>${escapeHtml(e.name || "")}</strong><br>
      ${contactLinks(e.phone)}
      Vehicle/Project: ${escapeHtml(e.vehicle || "")}<br>
      Details: ${escapeHtml(e.details || "")}<br>
      Created: ${formatDate(e.createdAt)}<br>
      <span class="badge">${escapeHtml(e.status || "New Estimate")}</span>
      ${files}
    `);
  }

  setResults(html);
};

window.loadJobs = async function () {
  setResults("<h3>Loading jobs...</h3>");

  const snap = await newestDocs("serviceLogs");
  let html = "<h3>Jobs</h3>";

  for (const doc of snap.docs) {
    const j = doc.data();
    const files = await renderFileLinks(j.files);
    const cls = statusClass(j.status, j.priority);

    html += card(`
      <strong>${escapeHtml(j.customer || "")}</strong><br>
      ${escapeHtml(j.vehicle || "")}<br><br>

      <span class="badge">${escapeHtml(j.status || "New")}</span>
      <span class="badge">${escapeHtml(j.priority || "Normal")}</span><br><br>

      <b>Assigned To:</b> ${escapeHtml(j.assignedTo || "—")}<br>
      <b>Parts:</b><br>${escapeHtml(j.partsNeeded || "—")}<br><br>
      <b>Work Notes:</b><br>${escapeHtml(j.laborNotes || "—")}<br><br>
      <b>Internal Notes:</b><br>${escapeHtml(j.internalNotes || "—")}<br><br>
      <b>Payment:</b> ${escapeHtml(j.paymentStatus || "—")}<br>
      <b>Paperwork:</b> ${escapeHtml(j.paperwork || "—")}<br>
      <b>Follow-up:</b> ${escapeHtml(j.followUpDate || "—")}<br>
      <b>Created:</b> ${formatDate(j.createdAt)}
      ${files}
    `, cls);
  }

  setResults(html);
};

window.loadTasks = async function () {
  setResults("<h3>Loading tasks...</h3>");

  const snap = await newestDocs("employeeTasks");
  let html = "<h3>Tasks</h3>";

  snap.forEach(doc => {
    const t = doc.data();

    html += card(`
      <strong>${escapeHtml(t.title || "")}</strong><br>
      Assigned: ${escapeHtml(t.assignedTo || "")}<br>
      Due: ${escapeHtml(t.dueDate || "")}<br>
      Status: ${escapeHtml(t.status || "Open")}<br>
      Created: ${formatDate(t.createdAt)}
    `);
  });

  setResults(html);
};

window.loadInternalNotes = async function () {
  setResults("<h3>Loading notes...</h3>");

  const snap = await newestDocs("internalNotes");
  let html = "<h3>Internal Notes</h3>";

  snap.forEach(doc => {
    const n = doc.data();

    html += card(`
      ${escapeHtml(n.note || "")}<br>
      <small>${formatDate(n.createdAt)}</small>
    `);
  });

  setResults(html);
};

/* DASHBOARD SUMMARY */

async function updateCounts() {
  const jobs = await getDocs(collection(db, "serviceLogs"));

  let active = 0;
  let parts = 0;
  let ready = 0;

  jobs.forEach(doc => {
    const status = doc.data().status || "";

    if (status !== "Completed" && status !== "Paid") active++;
    if (status === "Waiting on Parts") parts++;
    if (status === "Ready for Pickup") ready++;
  });

  setText("activeCount", active);
  setText("partsCount", parts);
  setText("readyCount", ready);
}

async function loadDashboardSummary() {
  const jobs = await newestDocs("serviceLogs");

  let urgent = "";
  let waiting = "";
  let ready = "";

  jobs.forEach(doc => {
    const j = doc.data();

    const mini = `
      <strong>${escapeHtml(j.customer || "")}</strong><br>
      ${escapeHtml(j.vehicle || "")}<br>
      <span class="badge">${escapeHtml(j.status || "")}</span>
      <span class="badge">${escapeHtml(j.priority || "")}</span>
    `;

    if ((j.priority || "").toLowerCase() === "urgent") urgent += card(mini, "urgentCard");
    if (j.status === "Waiting on Parts") waiting += card(mini, "waitingCard");
    if (j.status === "Ready for Pickup") ready += card(mini, "readyCard");
  });

  const summary = `
    <h3>Quick Shop Check</h3>
    <h3>Urgent</h3>
    ${urgent || card("No urgent jobs right now.")}
    <h3>Waiting on Parts</h3>
    ${waiting || card("Nothing waiting on parts.")}
    <h3>Ready for Pickup</h3>
    ${ready || card("Nothing marked ready yet.")}
  `;

  setResults(summary);
}

/* DEFAULT */

document.addEventListener("DOMContentLoaded", () => {
  showTab("home");
});
