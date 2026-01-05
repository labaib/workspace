const GITHUB_TOKEN = "INSERISCI_IL_TUO_PERSONAL_ACCESS_TOKEN";
const OWNER = "labaib";
const REPO = "workspace";
const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}/discussions`;

// mappa categorie con ID GitHub (li recuperi da GitHub REST API)
const CATEGORY_MAP = {
  "Annunci": 1,
  "Documentazione": 2,
  "Generale": 3,
  "Proposte": 4,
  "Q&A": 5,
  "Votazioni": 6
};

// template YAML ufficiali vengono letti come riferimento per i campi
// esempio semplificato per Proposta
const TEMPLATES = {
  "Proposte": [
    { id: "titolo", label: "Titolo della proposta", type: "text", required: true },
    { id: "descrizione", label: "Descrizione", type: "textarea", required: true },
    { id: "richiesta", label: "Cosa chiedi alla comunità?", type: "textarea", required: true }
  ],
  "Q&A": [
    { id: "titolo", label: "Oggetto della domanda", type: "text", required: true },
    { id: "dettagli", label: "Dettagli", type: "textarea", required: true }
  ],
  "Votazioni": [
    { id: "proposta", label: "Titolo della proposta", type: "text", required: true },
    { id: "voto", label: "Voto", type: "select", options: ["Favorevole","Contrario","Astenuto"], required: true }
  ]
};

// cambio sezione
document.querySelectorAll('nav a').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(link.dataset.target).classList.add('active');
    loadSection(link.dataset.target);
  });
});

// carica sezione con contenuti o form
function loadSection(section) {
  const container = document.getElementById(section);
  container.innerHTML = ""; // reset

  if (section === "Annunci" || section === "Documentazione" || section === "Generale") {
    fetchDiscussions(section, container);
  } else if (section in TEMPLATES) {
    renderForm(section, container);
  }
}

// fetch discussions dalla categoria
async function fetchDiscussions(section, container) {
  const categoryId = CATEGORY_MAP[section];
  const response = await fetch(`${API_BASE}?per_page=20`, {
    headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" }
  });
  const discussions = await response.json();

  // filtra per categoria
  const filtered = discussions.filter(d => d.category.name === section);

  filtered.forEach(d => {
    const div = document.createElement('div');
    div.classList.add('card', 'mb-2');
    div.innerHTML = `<div class="card-body">
      <h5 class="card-title">${d.title}</h5>
      <p class="card-text">${d.body}</p>
      <a href="${d.html_url}" target="_blank">Apri su GitHub</a>
    </div>`;
    container.appendChild(div);
  });
}

// renderizza form
function renderForm(section, container) {
  const form = document.createElement('form');
  TEMPLATES[section].forEach(field => {
    const div = document.createElement('div');
    div.classList.add('mb-3');
    const label = document.createElement('label');
    label.textContent = field.label;
    label.classList.add('form-label');
    div.appendChild(label);

    let input;
    if (field.type === "textarea") {
      input = document.createElement('textarea');
      input.classList.add('form-control');
    } else if (field.type === "select") {
      input = document.createElement('select');
      input.classList.add('form-select');
      field.options.forEach(opt => {
        const o = document.createElement('option');
        o.value = opt;
        o.textContent = opt;
        input.appendChild(o);
      });
    } else {
      input = document.createElement('input');
      input.type = field.type;
      input.classList.add('form-control');
    }
    input.id = field.id;
    if (field.required) input.required = true;
    div.appendChild(input);
    form.appendChild(div);
  });

  const submit = document.createElement('button');
  submit.textContent = "Invia";
  submit.classList.add('btn','btn-primary');
  form.appendChild(submit);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bodyContent = TEMPLATES[section].map(f => {
      const val = document.getElementById(f.id).value;
      return `**${f.label}:**\n${val}`;
    }).join("\n\n");

    await createDiscussion(section, `Nuovo ${section}`, bodyContent);
    alert("Inviato con successo!");
    form.reset();
  });

  container.appendChild(form);
}

// POST discussion su GitHub
async function createDiscussion(section, title, body) {
  const categoryId = CATEGORY_MAP[section];
  await fetch(API_BASE, {
    method: "POST",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title: title,
      body: body,
      category_id: categoryId
    })
  });
}
