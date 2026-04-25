
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

function value(id) {
  return document.getElementById(id)?.value || "";
}

function setResults(html) {
  document.getElementById("results").innerHTML = html;
}

function card(html) {
  return `<div class="resultCard">${html}</div>`;
}

/* PUBLIC CUSTOMER FORM */
window.saveCustomer = async function () {
  const data = {
    name: value("custName"),
    phone: value("custPhone"),
    email: value("custEmail"),
    vehicle: value("vehicleInfo"),
    vin: value("vin"),
    issue: value("issue"),
    status: "New",
    priority: "Normal",
    createdAt: new Date()
  };

  if (!data.name || !data.phone) {
    alert("Enter customer name and phone.");
    return;
  }

  await addDoc(collection(db, "customers"), data);

  await addDoc(collection(db, "vehicles"), {
    customerName: data.name,
    phone: data.phone,
    vehicle: data.vehicle,
    vin: data.vin,
    createdAt: new Date()
  });

  alert("Customer saved!");
};

/* APPOINTMENT REQUEST */
window.saveAppointment = async function () {
  const data = {
    name: value("apptName"),
    phone: value("apptPhone"),
    vehicle: value("apptVehicle"),
    date: value("apptDate"),
    time: value("apptTime"),
    service: value("apptService"),
    status: "Requested",
    createdAt: new Date()
  };

  if (!data.name || !data.phone || !data.date) {
    alert("Enter name, phone, and appointment date.");
    return;
  }

  await addDoc(collection(db, "appointments"), data);
  alert("Appointment request saved!");
};

/* ESTIMATE REQUEST */
window.saveEstimate = async function () {
  const data = {
    name: value("estName"),
    phone: value("estPhone"),
    vehicle: value("estVehicle"),
    details: value("estDetails"),
    status: "New Estimate",
    createdAt: new Date()
  };

  if (!data.name || !data.phone || !data.details) {
    alert("Enter name, phone, and job details.");
    return;
  }

  await addDoc(collection(db, "estimates"), data);
  alert("Estimate request saved!");
};

/* AUTH */
window.login = async function () {
  try {
    await signInWithEmailAndPassword(
      auth,
      value("loginEmail"),
      value("loginPassword")
    );
    alert("Logged in!");
  } catch (error) {
    alert(error.message);
  }
};

window.logout = async function () {
  await signOut(auth);
};

onAuthStateChanged(auth, (user) => {
  const dashboard = document.getElementById("dashboard");
  const status = document.getElementById("loginStatus");

  if (user) {
    dashboard.classList.remove("hidden");
    status.innerText = "Logged in as " + user.email;
    updateCounts();
  } else {
    dashboard.classList.add("hidden");
    status.innerText = "Not logged in";
  }
});

/* EMPLOYEE JOB LOG */
window.saveServiceLog = async function () {
  const data = {
    customer: value("jobCustomer"),
    vehicle: value("jobVehicle"),
    assignedTo: value("assignedTo"),
    status: value("jobStatus"),
    priority: value("priority"),
    partsNeeded: value("partsNeeded"),
    laborNotes: value("laborNotes"),
    internalNotes: value("internalJobNotes"),
    paymentStatus: value("paymentStatus"),
    paperwork: value("paperwork"),
    followUpDate: value("followUpDate"),
    createdAt: new Date(),
    lastUpdated: new Date()
  };

  if (!data.customer || !data.vehicle) {
    alert("Enter customer and vehicle.");
    return;
  }

  await addDoc(collection(db, "serviceLogs"), data);
  alert("Job log saved!");
  updateCounts();
};

/* EMPLOYEE TASKS */
window.saveTask = async function () {
  const data = {
    title: value("taskTitle"),
    assignedTo: value("taskAssigned"),
    dueDate: value("taskDue"),
    status: "Open",
    createdAt: new Date()
  };

  if (!data.title) {
    alert("Enter a task.");
    return;
  }

  await addDoc(collection(db, "employeeTasks"), data);
  alert("Task saved!");
};

/* INTERNAL NOTES */
window.saveInternalNote = async function () {
  const data = {
    note: value("internalNote"),
    createdAt: new Date()
  };

  if (!data.note) {
    alert("Enter a note.");
    return;
  }

  await addDoc(collection(db, "internalNotes"), data);
  alert("Internal note saved!");
};

/* LOADERS */
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
    `);
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
      Phone: ${v.phone || ""}<br>
      VIN: ${v.vin || ""}
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
    `);
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
    `);
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
    `);
  });

  setResults(html);
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
    `);
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

/* DASHBOARD COUNTS */
async function updateCounts() {
  const jobs = await getDocs(collection(db, "serviceLogs"));

  let active = 0;
  let parts = 0;
  let ready = 0;

  jobs.forEach(doc => {
    const j = doc.data();
    if (j.status !== "Completed" && j.status !== "Paid") active++;
    if (j.status === "Waiting on Parts") parts++;
    if (j.status === "Ready for Pickup") ready++;
  });

  const activeEl = document.getElementById("activeCount");
  const partsEl = document.getElementById("partsCount");
  const readyEl = document.getElementById("readyCount");

  if (activeEl) activeEl.innerText = active;
  if (partsEl) partsEl.innerText = parts;
  if (readyEl) readyEl.innerText = ready;
}
