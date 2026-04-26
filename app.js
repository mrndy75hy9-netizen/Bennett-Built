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

let allJobs = [];
let allCustomers = [];
let allAppointments = [];
let allEstimates = [];

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

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cleanPhone(phone = "") {
  return phone.replace(/[^\d]/g, "");
}

function safeFileName(name) {
  return name
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase();
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

function addCopyButton(label, text) {
  const safe = escapeHtml(text || "");
  return `<button onclick="copyText('${encodeURIComponent(text || "")}')">${label}</button>`;
}

window.copyText = async function (encodedText) {
  const text = decodeURIComponent(encodedText || "");

  try {
    await navigator.clipboard.writeText(text);
    alert("Copied.");
  } catch {
    alert(text);
  }
};

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

async function newestDocs(collectionName) {
  try {
    const q = query(collection(db, collectionName), orderBy("createdAt", "desc"));
    return await getDocs(q);
  } catch {
    return await getDocs(collection(db, collectionName));
  }
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

  if (id === "dashboard") {
    loadDashboardHome();
  }
};

/* PUBLIC CUSTOMER FORMS */

window.saveCustomer = async function () {
  const name = value("custName");
  const phone = value("custPhone");

  if (!name || !phone) {
    alert("Please enter name and phone.");
    return;
  }

  try {
    setResults("");
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

    alert("Got it. We’ll take a look.");
  } catch (error) {
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

    alert("Appointment request sent. We’ll confirm before it’s officially scheduled.");
  } catch (error) {
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

    alert("Estimate request sent. We’ll give the best ballpark we can.");
  } catch (error) {
    alert("Error saving estimate: " + error.message);
  }
};

/* AUTH, OPTIONAL IF YOUR HTML HAS LOGIN FIELDS */

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
  const loginStatus = document.getElementById("loginStatus");

  if (user) {
    if (loginStatus) loginStatus.innerText = "Logged in as " + user.email;
  } else {
    if (loginStatus) loginStatus.innerText = "Not logged in";
  }
});

/* DASHBOARD BUSINESS FEATURES */

window.saveServiceLog = async function () {
  const customer = value("jobCustomer");
  const vehicle = value("jobVehicle");

  if (!customer || !vehicle) {
    alert("Need customer and vehicle/project.");
    return;
  }

  try {
    const files = await uploadFiles("jobFiles", "jobs");

    await addDoc(collection(db, "serviceLogs"), {
      customer,
      vehicle,
      assignedTo: value("assignedTo"),
      status: value("jobStatus") || "New",
      priority: value("priority") || "Normal",
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

    alert("Job saved.");
    loadJobs();
  } catch (err) {
    alert("Error saving job: " + err.message);
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

/* SEARCH + FILTER UI */

function dashboardTools() {
  return `
    <div class="dashSearch">
      <input id="dashSearchBox" placeholder="Search customer, vehicle, phone, status, notes..." oninput="filterCurrentResults()">
      <select id="dashStatusFilter" onchange="filterCurrentResults()">
        <option value="">All statuses</option>
        <option value="new">New</option>
        <option value="diagnosing">Diagnosing</option>
        <option value="in progress">In Progress</option>
        <option value="waiting">Waiting on Parts</option>
        <option value="ready">Ready for Pickup</option>
        <option value="completed">Completed</option>
        <option value="paid">Paid</option>
        <option value="urgent">Urgent</option>
      </select>
    </div>
  `;
}

function filterItems(items, fields) {
  const search = value("dashSearchBox").toLowerCase();
  const status = value("dashStatusFilter").toLowerCase();

  return items.filter(item => {
    const haystack = fields.map(field => item[field] || "").join(" ").toLowerCase();
    const statusText = `${item.status || ""} ${item.priority || ""}`.toLowerCase();

    const searchOk = !search || haystack.includes(search);
    const statusOk = !status || statusText.includes(status);

    return searchOk && statusOk;
  });
}

window.filterCurrentResults = function () {
  const mode = window.currentDashboardMode;

  if (mode === "jobs") renderJobs(allJobs);
  if (mode === "customers") renderCustomers(allCustomers);
  if (mode === "appointments") renderAppointments(allAppointments);
  if (mode === "estimates") renderEstimates(allEstimates);
};

/* LOAD RECORDS */

window.loadCustomers = async function () {
  window.currentDashboardMode = "customers";
  setResults("<h3>Loading customers...</h3>");

  const snap = await newestDocs("customers");
  allCustomers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  renderCustomers(allCustomers);
};

async function renderCustomers(items) {
  const filtered = filterItems(items, ["name", "phone", "email", "vehicle", "vin", "issue", "status"]);
  let html = dashboardTools() + "<h3>Customers</h3>";

  if (!filtered.length) html += card("No matching customers.");

  for (const c of filtered) {
    const files = await renderFileLinks(c.files);

    const copyInfo = `${c.name || ""}\n${c.phone || ""}\n${c.email || ""}\n${c.vehicle || ""}\n${c.vin || ""}\n${c.issue || ""}`;

    html += card(`
      <strong>${escapeHtml(c.name || "")}</strong><br>
      ${contactLinks(c.phone, c.email)}
      Phone: ${escapeHtml(c.phone || "")}<br>
      Vehicle/Project: ${escapeHtml(c.vehicle || "")}<br>
      VIN: ${escapeHtml(c.vin || "")}<br>
      Issue: ${escapeHtml(c.issue || "")}<br>
      Created: ${formatDate(c.createdAt)}<br>
      <span class="badge">${escapeHtml(c.status || "New")}</span><br>
      ${addCopyButton("Copy Info", copyInfo)}
      ${files}
    `);
  }

  setResults(html);
}

window.loadAppointments = async function () {
  window.currentDashboardMode = "appointments";
  setResults("<h3>Loading appointments...</h3>");

  const snap = await newestDocs("appointments");
  allAppointments = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  renderAppointments(allAppointments);
};

async function renderAppointments(items) {
  const filtered = filterItems(items, ["name", "phone", "vehicle", "date", "time", "service", "status"]);
  let html = dashboardTools() + "<h3>Appointments</h3>";

  if (!filtered.length) html += card("No matching appointments.");

  for (const a of filtered) {
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
}

window.loadEstimates = async function () {
  window.currentDashboardMode = "estimates";
  setResults("<h3>Loading estimates...</h3>");

  const snap = await newestDocs("estimates");
  allEstimates = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  renderEstimates(allEstimates);
};

async function renderEstimates(items) {
  const filtered = filterItems(items, ["name", "phone", "vehicle", "details", "status"]);
  let html = dashboardTools() + "<h3>Estimates</h3>";

  if (!filtered.length) html += card("No matching estimates.");

  for (const e of filtered) {
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
}

window.loadJobs = async function () {
  window.currentDashboardMode = "jobs";
  setResults("<h3>Loading jobs...</h3>");

  const snap = await newestDocs("serviceLogs");
  allJobs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  renderJobs(allJobs);
};

async function renderJobs(items) {
  const filtered = filterItems(items, [
    "customer",
    "vehicle",
    "assignedTo",
    "status",
    "priority",
    "partsNeeded",
    "laborNotes",
    "internalNotes",
    "paymentStatus",
    "paperwork",
    "followUpDate"
  ]);

  let html = dashboardTools() + "<h3>Jobs</h3>";

  if (!filtered.length) html += card("No matching jobs.");

  for (const j of filtered) {
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
}

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

/* SMART DASHBOARD HOME */

window.loadDashboardHome = async function () {
  setResults("<h3>Loading shop dashboard...</h3>");

  const jobsSnap = await newestDocs("serviceLogs");
  const appointmentsSnap = await newestDocs("appointments");

  const jobs = jobsSnap.docs.map(doc => doc.data());
  const appointments = appointmentsSnap.docs.map(doc => doc.data());

  let active = 0;
  let urgent = "";
  let waiting = "";
  let ready = "";
  let upcoming = "";

  jobs.forEach(j => {
    const status = j.status || "";
    const priority = j.priority || "";

    if (status !== "Completed" && status !== "Paid") active++;

    const mini = `
      <strong>${escapeHtml(j.customer || "")}</strong><br>
      ${escapeHtml(j.vehicle || "")}<br>
      <span class="badge">${escapeHtml(status || "New")}</span>
      <span class="badge">${escapeHtml(priority || "Normal")}</span>
    `;

    if (priority.toLowerCase() === "urgent") urgent += card(mini, "urgentCard");
    if (status === "Waiting on Parts") waiting += card(mini, "waitingCard");
    if (status === "Ready for Pickup") ready += card(mini, "readyCard");
  });

  appointments.slice(0, 5).forEach(a => {
    upcoming += card(`
      <strong>${escapeHtml(a.name || "")}</strong><br>
      ${contactLinks(a.phone)}
      ${escapeHtml(a.vehicle || "")}<br>
      ${escapeHtml(a.date || "")} ${escapeHtml(a.time || "")}<br>
      <span class="badge">${escapeHtml(a.status || "Requested")}</span>
    `);
  });

  const html = `
    <div class="dashboardStats">
      <div class="statBox"><strong>${active}</strong><span>Active Jobs</span></div>
      <div class="statBox"><strong>${jobs.length}</strong><span>Total Jobs</span></div>
      <div class="statBox"><strong>${appointments.length}</strong><span>Appointments</span></div>
    </div>

    <h3>Urgent Jobs</h3>
    ${urgent || card("No urgent jobs right now.")}

    <h3>Waiting on Parts</h3>
    ${waiting || card("Nothing waiting on parts.")}

    <h3>Ready for Pickup</h3>
    ${ready || card("Nothing marked ready yet.")}

    <h3>Upcoming Appointment Requests</h3>
    ${upcoming || card("No appointment requests yet.")}
  `;

  setResults(html);
};

/* DEFAULT */

document.addEventListener("DOMContentLoaded", () => {
  showTab("home");
});
