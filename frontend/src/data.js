export const SLIDES = [
  {
    src: "/assets/banner1.jpg",
    alt: "Two ARU students registering on a laptop outdoors",
  },
  {
    src: "/assets/banner2.jpg",
    alt: "A group of students working on a project together",
  },
  {
    src: "/assets/banner3.jpg",
    alt: "A student submitting a project in the library",
  },
  {
    src: "/assets/phone-register.jpg",
    alt: "A student registering on her phone",
  },
  {
    src: "/assets/phone-project.jpg",
    alt: "A student showing a submitted project on her phone",
  },
];

export const TICKER = [
  "Register with your ARU details",
  "Choose your school, department and course",
  "Select the technologies you used",
  "Group leader submits once, all members appear",
  "Two supervisors are notified instantly",
  "Search past projects by technology, course, topic or year",
];

export const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "▦" },
  { id: "browse", label: "Browse Projects", icon: "⌕" },
  { id: "submit", label: "Submit Project", icon: "⬆" },
  { id: "mine", label: "My Projects", icon: "▤" },
  { id: "groups", label: "Group Projects", icon: "☻" },
  { id: "supervisors", label: "Supervisors", icon: "✎" },
  { id: "notifications", label: "Notifications", icon: "✉" },
  { id: "profile", label: "Profile & Settings", icon: "⚙" },
];

export const PROJECTS = [
  {
    id: 1,
    title: "Hostel Booking System",
    course: "BSc Computer Science",
    year: 2026,
    tech: ["Django", "React", "SQLite"],
    status: "Approved",
    type: "Individual",
    supervisors: ["Dr. Godfrey Luwemba", "Mr. Alexander Moreka"],
  },
  {
    id: 2,
    title: "Smart Public Toilet Occupancy Display",
    course: "BSc Computer Engineering",
    year: 2026,
    tech: ["MQTT", "Django", "ESP32"],
    status: "Pending review",
    type: "Group",
    supervisors: ["Dr. Godfrey Luwemba", "Mr. Alexander Moreka"],
  },
  {
    id: 3,
    title: "Land Parcel Mapping Portal",
    course: "BSc Geomatics",
    year: 2025,
    tech: ["Leaflet", "PostgreSQL", "Django"],
    status: "Approved",
    type: "Group",
    supervisors: ["Dr. A. Mushi", "Ms. R. Kimaro"],
  },
  {
    id: 4,
    title: "Campus Queue Manager",
    course: "BSc Information Systems",
    year: 2025,
    tech: ["React", "Node.js", "MongoDB"],
    status: "Approved",
    type: "Individual",
    supervisors: ["Mr. J. Temba", "Dr. S. Massawe"],
  },
  {
    id: 5,
    title: "Construction Cost Estimator",
    course: "BSc Quantity Surveying",
    year: 2024,
    tech: ["Python", "Flask", "SQLite"],
    status: "Approved",
    type: "Individual",
    supervisors: ["Dr. P. Lyimo", "Mr. K. Mrema"],
  },
];

export const SUPERVISORS = [
  { name: "Dr. Godfrey Luwemba", dept: "Computer Systems & Mathematics", load: 6 },
  { name: "Mr. Alexander Moreka", dept: "Computer Systems & Mathematics", load: 5 },
  { name: "Dr. A. Mushi", dept: "Geomatics", load: 4 },
  { name: "Ms. R. Kimaro", dept: "Geomatics", load: 3 },
  { name: "Mr. J. Temba", dept: "Information Systems", load: 5 },
  { name: "Dr. P. Lyimo", dept: "Quantity Surveying", load: 2 },
];

export const TECHS = [
  "Django", "React", "SQLite", "PostgreSQL", "MySQL", "Node.js", "Flask",
  "Python", "Java", "Flutter", "MQTT", "ESP32", "Leaflet", "MongoDB",
];

export const SCHOOLS = {
  "School of Earth Sciences, Real Estate, Business & Informatics (SERBI)": {
    "Computer Systems & Mathematics": [
      "BSc Computer Science",
      "BSc Information Systems",
      "BSc Computer Engineering",
    ],
    Geomatics: ["BSc Geomatics", "BSc Land Surveying"],
  },
  "School of Architecture, Construction Economics & Management (SACEM)": {
    "Quantity Surveying": ["BSc Quantity Surveying"],
    Architecture: ["BSc Architecture"],
  },
};

export const NOTIFS = [
  { id: 1, text: "Your project “Hostel Booking System” was approved.", time: "2h ago", tone: "green" },
  { id: 2, text: "Dr. Godfrey Luwemba commented on “Smart Public Toilet Occupancy Display”.", time: "Yesterday", tone: "blue" },
  { id: 3, text: "Group member Neema A. joined your group project.", time: "2 days ago", tone: "orange" },
];
