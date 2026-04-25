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
  return document.getElementById(id).value;
}

window.saveCustomer = async function () {
  await addDoc(collection(db, "customers"), {
    name: value("custName"),
    phone: value("custPhone"),
    email: value("custEmail"),
    vehicle: value("vehicleInfo"),
    vin: value("vin"),
    issue: value("issue"),
    status: "New",
    priority: "Normal",
    createdAt: new Date()
  });

  await addDoc(collection(db, "vehicles"), {
    customerName: value("custName"),
    phone: value("custPhone"),
    vehicle: value("vehicleInfo"),
    vin: value("vin"),
    createdAt: new Date()
  });

  alert("Customer saved!");
};

window.saveAppointment = async function () {
  await addDoc(collection(db, "appointments"), {
    name: value("apptName"),
    phone: value("apptPhone"),
    vehicle: value("apptVehicle"),
    date: value("apptDate"),
    time: value("apptTime"),
    service: value("apptService"),
    status: "Requested",
    createdAt: new Date()
  });

  alert("Appointment request saved!");
};

window.saveEstimate = async function () {
  await addDoc(collection(db, "estimates"), {
    name: value("estName"),
    phone: value("estPhone"),
    vehicle: value("estVehicle"),
    details: value("estDetails"),
    status: "New Estimate",
    createdAt: new Date()
  });

  alert("Estimate request saved!");
};

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

window.saveServiceLog = async function () {
  await addDoc(collection(db, "serviceLogs"), {
    customer: value("jobCustomer"),
    vehicle: value("jobVehicle"),
    assignedTo: value("assignedTo"),
    status: value("jobStatus"),
    priority: value("priority"),
    partsNeeded: value("partsNeeded"),
    laborNotes: value("laborNotes"),
    internalNotes: value("internalJobNotes"),
    createdAt: new Date(),
    lastUpdated: new Date()
  });

  alert("Job log saved!");
  updateCounts();
};

window.saveTask = async function () {
  await addDoc(collection(db, "employeeTasks"), {
    title: value("taskTitle"),
    assignedTo: value("taskAssigned"),
    dueDate: value("taskDue"),
    status: "Open",
    createdAt: new Date()
  });

  alert("Task saved!");
};

function card(html) {
  return `<div class="resultCard">${html}</div>`;
}

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
      Issue: ${c.issue || ""}<br>
      <span class="badge">${c.status || "New"}</span>
    `);
  });

  document.getElementById("results").innerHTML = html;
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

  document.getElementById("results").innerHTML = html;
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

  document.getElementById("results").innerHTML = html;
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
      Parts: ${j.partsNeeded || ""}<br>
      Labor Notes: ${j.laborNotes || ""}<br>
      Internal Notes: ${j.internalNotes || ""}<br>
      Priority: ${j.priority || ""}<br>
      <span class="badge">${j.status || ""}</span>
    `);
  });

  document.getElementById("results").innerHTML = html;
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

  document.getElementById("results").innerHTML = html;
};

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

  document.getElementById("activeCount").innerText = active;
  document.getElementById("partsCount").innerText = parts;
  document.getElementById("readyCount").innerText = ready;
}
