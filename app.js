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

function setStatus(id, message) {
  const el = document.getElementById(id);
  if (el) el.textContent = message;
}

function resetForm(id) {
  const form = document.getElementById(id);
  if (form) form.reset();
}

function setResults(html) {
  const results = document.getElementById("results");
  if (results) results.innerHTML = html;
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
  if (!files || !files.length) return "";

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

  if (!name || !phone) {
    setStatus("customerStatus", "Name and phone are needed before we can do much.");
    return;
  }

  setStatus("customerStatus", "Sending it over...");

  try {
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

    resetForm("intakeForm");
    setStatus("customerStatus", "Got it. We’ll take a look and reach out.");
  } catch (error) {
    setStatus("customerStatus", "Something didn’t send right: " + error.message);
  }
};

/* ESTIMATE FORM */

window.saveEstimate = async function () {
  const name = value("estName");
  const phone = value("estPhone");
  const details = value("estDetails");

  if (!name || !phone || !details) {
    setStatus("estimateStatus", "Name, phone, and details are needed.");
    return;
  }

  setStatus("estimateStatus", "Sending your ballpark request...");

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

    resetForm("estimateForm");
    setStatus("estimateStatus", "Got it. We’ll look it over and give you a starting point.");
  } catch (error) {
    setStatus("estimateStatus", "Something didn’t send right: " + error.message);
  }
};

/* APPOINTMENT FORM */

window.saveAppointment = async function () {
  const name = value("apptName");
  const phone = value("apptPhone");
  const date = value("apptDate");

  if (!name || !phone || !date) {
    setStatus("appointmentStatus", "Name, phone, and date are needed.");
    return;
  }

  setStatus("appointmentStatus", "Sending appointment request...");

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

    resetForm("appointmentForm");
    setStatus("appointmentStatus", "Request sent. We’ll confirm before anything is official.");
  } catch (error) {
    setStatus("appointmentStatus", "Something didn’t send right: " + error.message);
  }
};

/* AUTH */

window.login = async function () {
  try {
    await signInWithEmailAndPassword(
      auth,
      value("loginEmail"),
      value("loginPassword")
    );
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

/* DASHBOARD TABS */

window.showDash = function (id) {
  document.querySelectorAll(".dashPage").forEach(section => {
    section.classList.add("hidden");
  });

  const target = document.getElementById(id);
  if (target) target.classList.remove("hidden");

  setResults("");
};

/* EMPLOYEE DASHBOARD SAVES */

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

    const jobForm = document.getElementById("jobCustomer")?.closest("form");
    if (jobForm) jobForm.reset();

    alert("Job saved.");
    loadJobs();
    updateCounts();
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

  await addDoc(collection(db, "employeeTasks"), {
    title,
    assignedTo: value("taskAssigned"),
    dueDate: value("taskDue"),
    status: "Open",
    createdAt: new Date()
  });

  alert("Task saved.");
};

window.saveInternalNote = async function () {
  const note = value("internalNote");

  if (!note) {
    alert("Enter a note.");
    return;
  }

  await addDoc(collection(db, "internalNotes"), {
    note,
    createdAt: new Date()
  });

  alert("Note saved.");
};

/* LOAD RECORDS */

window.loadCustomers = async function () {
  const snap = await getDocs(collection(db, "customers"));
  let html = "<h3>Customers</h3>";

  for (const doc of snap.docs) {
    const c = doc.data();
    const files = await renderFileLinks(c.files);

    html += card(`
      <strong>${c.name || ""}</strong><br>
      <a href="tel:${c.phone || ""}">Call</a> |
      <a href="sms:${c.phone || ""}">Text</a><br>
      Phone: ${c.phone || ""}<br>
      Email: ${c.email || ""}<br>
      Vehicle/Project: ${c.vehicle || ""}<br>
      VIN: ${c.vin || ""}<br>
      Issue: ${c.issue || ""}<br>
      <span class="badge">${c.status || "New"}</span>
      ${files}
    `);
  }

  setResults(html);
};

window.loadVehicles = async function () {
  const snap = await getDocs(collection(db, "vehicles"));
  let html = "<h3>Vehicles / Projects</h3>";

  for (const doc of snap.docs) {
    const v = doc.data();
    const files = await renderFileLinks(v.files);

    html += card(`
      <strong>${v.vehicle || ""}</strong><br>
      Customer: ${v.customerName || ""}<br>
      Phone: ${v.phone || ""}<br>
      VIN: ${v.vin || ""}
      ${files}
    `);
  }

  setResults(html);
};

window.loadAppointments = async function () {
  const snap = await getDocs(collection(db, "appointments"));
  let html = "<h3>Appointments</h3>";

  for (const doc of snap.docs) {
    const a = doc.data();
    const files = await renderFileLinks(a.files);

    html += card(`
      <strong>${a.name || ""}</strong><br>
      <a href="tel:${a.phone || ""}">Call</a> |
      <a href="sms:${a.phone || ""}">Text</a><br>
      Vehicle/Project: ${a.vehicle || ""}<br>
      Date: ${a.date || ""}<br>
      Time: ${a.time || ""}<br>
      Service: ${a.service || ""}<br>
      <span class="badge">${a.status || ""}</span>
      ${files}
    `);
  }

  setResults(html);
};

window.loadEstimates = async function () {
  const snap = await getDocs(collection(db, "estimates"));
  let html = "<h3>Estimates</h3>";

  for (const doc of snap.docs) {
    const e = doc.data();
    const files = await renderFileLinks(e.files);

    html += card(`
      <strong>${e.name || ""}</strong><br>
      <a href="tel:${e.phone || ""}">Call</a> |
      <a href="sms:${e.phone || ""}">Text</a><br>
      Vehicle/Project: ${e.vehicle || ""}<br>
      Details: ${e.details || ""}<br>
      <span class="badge">${e.status || ""}</span>
      ${files}
    `);
  }

  setResults(html);
};

window.loadJobs = async function () {
  const snap = await getDocs(collection(db, "serviceLogs"));
  let html = "<h3>Jobs</h3>";

  for (const doc of snap.docs) {
    const j = doc.data();
    const files = await renderFileLinks(j.files);

    html += card(`
      <strong>${j.customer || ""}</strong><br>
      ${j.vehicle || ""}<br><br>

      <b>Status:</b> ${j.status || ""}<br>
      <b>Priority:</b> ${j.priority || ""}<br>
      <b>Assigned:</b> ${j.assignedTo || ""}<br><br>

      <b>Parts:</b><br>${j.partsNeeded || "—"}<br><br>
      <b>Work Notes:</b><br>${j.laborNotes || "—"}<br><br>
      <b>Internal:</b><br>${j.internalNotes || "—"}<br><br>

      ${files}
    `);
  }

  setResults(html);
};

window.loadTasks = async function () {
  const snap = await getDocs(collection(db, "employeeTasks"));
  let html = "<h3>Tasks</h3>";

  snap.forEach(doc => {
    const t = doc.data();

    html += card(`
      <strong>${t.title || ""}</strong><br>
      Assigned: ${t.assignedTo || ""}<br>
      Due: ${t.dueDate || ""}<br>
      Status: ${t.status || ""}
    `);
  });

  setResults(html);
};

window.loadInternalNotes = async function () {
  const snap = await getDocs(collection(db, "internalNotes"));
  let html = "<h3>Internal Notes</h3>";

  snap.forEach(doc => {
    const n = doc.data();
    html += card(`${n.note || ""}`);
  });

  setResults(html);
};

/* COUNTERS */

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

  const activeEl = document.getElementById("activeCount");
  const partsEl = document.getElementById("partsCount");
  const readyEl = document.getElementById("readyCount");

  if (activeEl) activeEl.innerText = active;
  if (partsEl) partsEl.innerText = parts;
  if (readyEl) readyEl.innerText = ready;
}

/* STARTUP */

document.addEventListener("DOMContentLoaded", () => {
  setStatus("customerStatus", "");
  setStatus("estimateStatus", "");
  setStatus("appointmentStatus", "");
});
